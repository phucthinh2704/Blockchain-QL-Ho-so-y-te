const mongoose = require("mongoose");

const blockchainTransactionSchema = new mongoose.Schema({
	transactionHash: {
		type: String,
		required: true,
		unique: true,
	},
	recordId: {
		type: String,
		required: true,
	},
	action: {
		type: String,
		enum: ["create", "update", "delete"],
		required: true,
	},
	userAddress: {
		type: String,
		required: true, // Address của người thực hiện transaction
	},
	status: {
		type: String,
		enum: ["pending", "success", "failed"],
		default: "pending",
	},
	blockNumber: {
		type: Number,
	},
	gasUsed: {
		type: Number,
	},
}, {
	timestamps: true
});

module.exports = mongoose.model("BlockchainTransaction", blockchainTransactionSchema);