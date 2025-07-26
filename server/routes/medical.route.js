const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const blockchainService = require("../services/BlockchainService");
const MedicalRecord = require("../models/MedicalRecord");

// 1. Tạo hồ sơ y tế mới (chỉ doctor)
router.post(
	"/create",
	authenticateToken,
	authorize(["doctor"]),
	async (req, res) => {
		try {
			const { patientId, diagnosis, treatment } = req.body;
			const doctorId = req.user.userId; // Lấy từ token

			// Validate input
			if (!patientId || !diagnosis) {
				return res.status(400).json({
					success: false,
					message: "Thiếu thông tin bắt buộc",
				});
			}

			// Generate unique recordId
			const recordId = `REC${Date.now()}`;

			// Tạo record trên blockchain
			const blockchainResult =
				await blockchainService.createMedicalRecord({
					recordId,
					patientId,
					doctorId,
					diagnosis,
					treatment: treatment || "",
				});

			// Lưu vào database
			const medicalRecord = new MedicalRecord({
				recordId,
				patientId,
				doctorId,
				diagnosis,
				treatment,
				blockchainHash: blockchainResult.recordHash,
			});

			await medicalRecord.save();

			res.status(201).json({
				success: true,
				message: "Tạo hồ sơ y tế thành công",
				data: {
					recordId,
					blockHash: blockchainResult.blockHash,
					blockNumber: blockchainResult.blockNumber,
				},
			});
		} catch (error) {
			console.error("Error creating medical record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi tạo hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 2. Lấy thông tin hồ sơ y tế (doctor, admin hoặc patient chính họ)
router.get(
	"/:recordId",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { recordId } = req.params;

			const record = await MedicalRecord.findOne({ recordId })
				.populate("patientId", "name email phoneNumber")
				.populate("doctorId", "name email specialization");

			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Kiểm tra quyền truy cập
			if (
				req.user.role === "patient" &&
				record.patientId._id.toString() !== req.user.userId
			) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			res.json({
				success: true,
				data: record,
			});
		} catch (error) {
			console.error("Error getting medical record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy thông tin hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 3. Cập nhật hồ sơ y tế (chỉ doctor)
router.put(
	"/:recordId",
	authenticateToken,
	authorize(["doctor"]),
	async (req, res) => {
		try {
			const { recordId } = req.params;
			const { diagnosis, treatment } = req.body;
			const doctorId = req.user.userId;

			// Tìm record hiện tại
			const existingRecord = await MedicalRecord.findOne({ recordId });
			if (!existingRecord) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Cập nhật trên blockchain
			const updatedData = {
				recordId,
				patientId: existingRecord.patientId,
				doctorId: doctorId,
				diagnosis: diagnosis || existingRecord.diagnosis,
				treatment: treatment || existingRecord.treatment,
			};

			const blockchainResult =
				await blockchainService.updateMedicalRecord(
					updatedData,
					doctorId
				);

			// Cập nhật database
			await MedicalRecord.findOneAndUpdate(
				{ recordId },
				{
					diagnosis: updatedData.diagnosis,
					treatment: updatedData.treatment,
					blockchainHash: blockchainResult.recordHash,
				}
			);

			res.json({
				success: true,
				message: "Cập nhật hồ sơ y tế thành công",
				data: {
					recordId,
					blockHash: blockchainResult.blockHash,
					blockNumber: blockchainResult.blockNumber,
				},
			});
		} catch (error) {
			console.error("Error updating medical record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi cập nhật hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 4. Xác thực hồ sơ y tế trên blockchain (tất cả roles)
router.post(
	"/verify/:recordId",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { recordId } = req.params;

			// Lấy hash từ database
			const record = await MedicalRecord.findOne({ recordId });
			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Kiểm tra quyền truy cập cho patient
			if (
				req.user.role === "patient" &&
				record.patientId.toString() !== req.user.userId
			) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			// Verify trên blockchain
			const verification = await blockchainService.verifyRecord(
				recordId,
				record.blockchainHash
			);

			res.json({
				success: true,
				message: "Kết quả xác thực",
				data: verification,
			});
		} catch (error) {
			console.error("Error verifying medical record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 5. Lấy hồ sơ theo bệnh nhân (patient chính họ, doctor, admin)
router.get(
	"/patient/:patientId",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { patientId } = req.params;

			// Patient chỉ xem được hồ sơ của chính họ
			if (req.user.role === "patient" && patientId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			const records = await MedicalRecord.find({ patientId })
				.populate("doctorId", "name specialization")
				.sort({ createdAt: -1 });

			res.json({
				success: true,
				data: records,
			});
		} catch (error) {
			console.error("Error getting patient records:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy hồ sơ bệnh nhân",
				error: error.message,
			});
		}
	}
);

// 6. Lấy hồ sơ theo bác sĩ (chỉ doctor và admin)
router.get(
	"/doctor/:doctorId",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const { doctorId } = req.params;

			// Doctor chỉ xem được hồ sơ do chính họ tạo (trừ admin)
			if (req.user.role === "doctor" && doctorId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			const records = await MedicalRecord.find({ doctorId })
				.populate("patientId", "name email phoneNumber")
				.sort({ createdAt: -1 });

			res.json({
				success: true,
				data: records,
			});
		} catch (error) {
			console.error("Error getting doctor records:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy hồ sơ bác sĩ",
				error: error.message,
			});
		}
	}
);

// 7. Lấy lịch sử hồ sơ y tế (doctor, admin hoặc patient chính họ)
router.get(
	"/history/:recordId",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { recordId } = req.params;

			// Kiểm tra quyền truy cập cho patient
			if (req.user.role === "patient") {
				const record = await MedicalRecord.findOne({ recordId });
				if (
					!record ||
					record.patientId.toString() !== req.user.userId
				) {
					return res.status(403).json({
						success: false,
						message: "Không có quyền truy cập hồ sơ này",
					});
				}
			}

			const history = await blockchainService.getRecordHistory(recordId);

			res.json({
				success: true,
				message: "Lịch sử hồ sơ y tế",
				data: history,
			});
		} catch (error) {
			console.error("Error getting record history:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy lịch sử hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

module.exports = router;
