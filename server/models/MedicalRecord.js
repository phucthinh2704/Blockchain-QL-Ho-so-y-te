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
	diagnosis: {
		type: String,
		required: true,
	},
	treatment: {
		type: String,
	},
	// Blockchain hash để verify
	blockchainHash: {
		type: String,
		required: true,
		unique: true,
	},
}, {
	timestamps: true,
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
