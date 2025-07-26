const Blockchain = require("../blockchain/Blockchain");
const BlockchainTransaction = require("../models/BlockchainTransaction");
const MedicalRecord = require("../models/MedicalRecord");

class BlockchainService {
	constructor() {
		this.blockchain = new Blockchain();
	}

	// Tạo medical record trên blockchain
	async createMedicalRecord(recordData) {
		try {
			// Tạo block trên blockchain
			const blockData = {
				type: "create_record",
				recordId: recordData.recordId,
				patientId: recordData.patientId,
				doctorId: recordData.doctorId,
				timestamp: Date.now(),
				hash: this.generateRecordHash(recordData),
			};

			const newBlock = this.blockchain.addBlock(blockData);

			// Lưu transaction vào database
			const transaction = new BlockchainTransaction({
				transactionHash: newBlock.hash,
				blockNumber: newBlock.index,
				recordId: recordData.recordId,
				action: "create_record",
				fromAddress: recordData.doctorWallet || "system",
				status: "confirmed",
				blockTimestamp: new Date(newBlock.timestamp),
			});

			await transaction.save();

			return {
				success: true,
				blockHash: newBlock.hash,
				blockIndex: newBlock.index,
				transactionHash: newBlock.hash,
			};
		} catch (error) {
			console.error(
				"Error creating medical record on blockchain:",
				error
			);
			throw error;
		}
	}

	// Cập nhật quyền truy cập
	async updateAccess(recordId, accessData) {
		try {
			const blockData = {
				type: "update_access",
				recordId: recordId,
				accessData: accessData,
				timestamp: Date.now(),
			};

			const newBlock = this.blockchain.addBlock(blockData);

			const transaction = new BlockchainTransaction({
				transactionHash: newBlock.hash,
				blockNumber: newBlock.index,
				recordId: recordId,
				action: "grant_access",
				fromAddress: accessData.granterWallet || "system",
				toAddress: accessData.granteeWallet || "unknown",
				status: "confirmed",
				blockTimestamp: new Date(newBlock.timestamp),
			});

			await transaction.save();

			return {
				success: true,
				blockHash: newBlock.hash,
				transactionHash: newBlock.hash,
			};
		} catch (error) {
			console.error("Error updating access on blockchain:", error);
			throw error;
		}
	}

	// Verify record integrity
	async verifyRecord(recordId, recordHash) {
		try {
			const blocks = this.blockchain.getBlocksByRecordId(recordId);

			if (blocks.length === 0) {
				return {
					valid: false,
					message: "Record not found on blockchain",
				};
			}

			// Kiểm tra hash của record
			const latestBlock = blocks[blocks.length - 1];
			const isHashValid = latestBlock.data.hash === recordHash;

			// Kiểm tra tính toàn vẹn của blockchain
			const isChainValid = this.blockchain.isChainValid();

			return {
				valid: isHashValid && isChainValid,
				blockHash: latestBlock.hash,
				blockIndex: latestBlock.index,
				message:
					isHashValid && isChainValid
						? "Record is valid"
						: "Record integrity compromised",
			};
		} catch (error) {
			console.error("Error verifying record:", error);
			throw error;
		}
	}

	// Generate hash cho medical record
	generateRecordHash(recordData) {
		const crypto = require("crypto");
		const dataString = JSON.stringify({
			recordId: recordData.recordId,
			patientId: recordData.patientId,
			diagnosis: recordData.diagnosis,
			treatment: recordData.treatment,
			recordDate: recordData.recordDate,
		});

		return crypto.createHash("sha256").update(dataString).digest("hex");
	}

	// Get blockchain info
	getBlockchainInfo() {
		return {
			totalBlocks: this.blockchain.chain.length,
			latestBlock: this.blockchain.getLatestBlock(),
			isValid: this.blockchain.isChainValid(),
			difficulty: this.blockchain.difficulty,
		};
	}

	// Get transaction history for a record
	async getRecordHistory(recordId) {
		try {
			const blocks = this.blockchain.getBlocksByRecordId(recordId);
			const transactions = await BlockchainTransaction.find({
				recordId,
			}).sort({ createdAt: -1 });

			return {
				blocks: blocks,
				transactions: transactions,
				totalTransactions: transactions.length,
			};
		} catch (error) {
			console.error("Error getting record history:", error);
			throw error;
		}
	}
}

// Singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
