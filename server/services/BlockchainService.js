const Blockchain = require("../blockchain/Blockchain");
const Transaction = require("../models/Transaction");
const crypto = require("crypto");

class BlockchainService {
	constructor() {
		this.blockchain = new Blockchain();
	}

	// Tạo medical record trên blockchain
	async createMedicalRecord(recordData) {
		try {
			const recordHash = this.generateRecordHash(recordData);

			// Tạo block data
			const blockData = {
				type: "CREATE",
				recordId: recordData.recordId,
				patientId: recordData.patientId,
				doctorId: recordData.doctorId,
				diagnosis: recordData.diagnosis,
				treatment: recordData.treatment,
				hash: recordHash,
			};

			// Thêm vào blockchain
			const newBlock = this.blockchain.addBlock(blockData);

			// Lưu transaction
			const transaction = new Transaction({
				txHash: newBlock.hash,
				blockNumber: newBlock.index,
				initiatorId: recordData.doctorId,
				recordId: recordData.recordId,
				action: "CREATE",
				status: "SUCCESS",
			});

			await transaction.save();

			return {
				success: true,
				blockHash: newBlock.hash,
				blockNumber: newBlock.index,
				recordHash: recordHash,
			};
		} catch (error) {
			console.error("Error creating medical record:", error);
			throw error;
		}
	}

	// Cập nhật medical record
	async updateMedicalRecord(recordData, initiatorId) {
		try {
			const updatedHash = this.generateRecordHash(recordData);

			const blockData = {
				type: "UPDATE",
				recordId: recordData.recordId,
				updatedHash: updatedHash,
			};

			const newBlock = this.blockchain.addBlock(blockData);

			const transaction = new Transaction({
				txHash: newBlock.hash,
				blockNumber: newBlock.index,
				initiatorId: initiatorId,
				recordId: recordData.recordId,
				action: "UPDATE",
				status: "SUCCESS",
			});

			await transaction.save();

			return {
				success: true,
				blockHash: newBlock.hash,
				blockNumber: newBlock.index,
				recordHash: updatedHash,
			};
		} catch (error) {
			console.error("Error updating medical record:", error);
			throw error;
		}
	}

	// Generate hash
	generateRecordHash(recordData) {
		const dataString = JSON.stringify({
			recordId: recordData.recordId,
			patientId: recordData.patientId,
			doctorId: recordData.doctorId,
			diagnosis: recordData.diagnosis,
			treatment: recordData.treatment || "",
		});

		return crypto.createHash("sha256").update(dataString).digest("hex");
	}

	// Verify record
	async verifyRecord(recordId, expectedHash) {
		const blocks = this.blockchain.getBlocksByRecordId(recordId);

		if (blocks.length === 0) {
			return { valid: false, message: "Record not found on blockchain" };
		}
		// console.log(blocks)

		const latestBlock = blocks[blocks.length - 1];
		const blockchainHash =
			latestBlock.data.hash || latestBlock.data.updatedHash;
		const isValid =
			blockchainHash === expectedHash && this.blockchain.isChainValid();

		return {
			valid: isValid,
			blockHash: latestBlock.hash,
			message: isValid ? "Record verified" : "Record invalid",
		};
	}

	// Get blockchain info
	getBlockchainInfo() {
		return this.blockchain.getChainInfo();
	}

	// Get record history
	async getRecordHistory(recordId) {
		const blocks = this.blockchain.getBlocksByRecordId(recordId);
		const transactions = await Transaction.find({ recordId })
			.populate("initiatorId", "name email")
			.sort({ createdAt: -1 });

		return {
			blocks: blocks,
			transactions: transactions,
			total: blocks.length,
		};
	}
}

const blockchainService = new BlockchainService();
const runService = async () => {
	// Tạo record
	const result = await blockchainService.createMedicalRecord({
		recordId: "REC001",
		patientId: "688439568d6ceedea41270b2",
		doctorId: "688439568d6ceedea41270b2",
		diagnosis: "Cảm cúm",
		treatment: "Nghỉ ngơi và uống thuốc",
	});

	// Update record
	// const updateResult = await blockchainService.updateMedicalRecord(
	// 	{
	// 		recordId: "REC001",
	// 		diagnosis: "Cảm cúm nặng",
	// 	},
	// 	"688439568d6ceedea41270b2"
	// );

	// Verify record
	// const verification = await blockchainService.verifyRecord(
	// 	"REC001",
	// 	"f4667982e3cbca1ef973e66057a6176111e415acab858d1fa4734171213281aa"
	// );

	// Get blockchain info
	const info = blockchainService.getBlockchainInfo();
	console.log("Create Result:", result);
	// console.log("Verification Result:", verification);
	console.log("Blockchain Info:", info);
};

module.exports = blockchainService;
