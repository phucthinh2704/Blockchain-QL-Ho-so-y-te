const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
	txHash: {
		type: String,
		required: true,
		unique: true,
	},
	blockNumber: {
		type: Number,
		required: true,
	},
	initiatorId : {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User", 
		required: true,
	},
	recordId: {
		type: String,
		required: true,
	},
	action: {
		type: String,
		enum: ["CREATE", "UPDATE"],
		required: true,
	},
	status: {
		type: String,
		enum: ["PENDING", "SUCCESS", "FAILED"],
		default: "PENDING",
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Transaction", transactionSchema);