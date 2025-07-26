const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
	recordId: {
		type: String,
		required: true,
		unique: true,
	},
	patientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	doctorId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	// Thông tin y tế cơ bản
	diagnosis: {
		type: String,
		required: true,
	},
	symptoms: {
		type: String,
	}, 
	treatment: {
		type: String,
	},
	medications: {
		type: String, 
	},
	// Blockchain info - chỉ giữ hash chính
	blockchainHash: {
		type: String,
		required: true,
		unique: true,
	},
	// Đơn giản hóa quyền truy cập
	isPublic: {
		type: Boolean,
		default: false, // Mặc định là riêng tư
	},
	recordType: {
		type: String,
		enum: ["consultation", "diagnosis", "prescription", "lab_result"],
		default: "consultation",
	},
	recordDate: {
		type: Date,
		default: Date.now,
	}
}, {
	timestamps: true
});

medicalRecordSchema.pre("save", function (next) {
	this.updatedAt = Date.now();
	next();
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
