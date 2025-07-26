const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const blockchainService = require("../services/BlockchainService");

// 1. Lấy thông tin blockchain (tất cả roles đã đăng nhập)
router.get(
	"/info",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	(req, res) => {
		try {
			const info = blockchainService.getBlockchainInfo();

			res.json({
				success: true,
				message: "Thông tin blockchain",
				data: info,
			});
		} catch (error) {
			console.error("Error getting blockchain info:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy thông tin blockchain",
				error: error.message,
			});
		}
	}
);

// 2. Kiểm tra tính hợp lệ của blockchain (chỉ doctor và admin)
router.get(
	"/validate",
	authenticateToken,
	authorize(["doctor", "admin"]),
	(req, res) => {
		try {
			const isValid = blockchainService.blockchain.isChainValid();

			res.json({
				success: true,
				message: "Kết quả kiểm tra blockchain",
				data: {
					isValid,
					status: isValid
						? "Blockchain hợp lệ"
						: "Blockchain không hợp lệ",
				},
			});
		} catch (error) {
			console.error("Error validating blockchain:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi kiểm tra blockchain",
				error: error.message,
			});
		}
	}
);

module.exports = router;
