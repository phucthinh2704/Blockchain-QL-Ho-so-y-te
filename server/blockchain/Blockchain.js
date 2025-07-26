const Block = require("./Block");
const fs = require("fs");
const path = require("path");

class Blockchain {
	constructor() {
		this.chainFile = path.join(__dirname, "../data/blockchain.json");
		this.chain = this.loadChain();

		// Tạo genesis block nếu chưa có
		if (this.chain.length === 0) {
			this.chain = [this.createGenesisBlock()];
			this.saveChain();
		}
	}

	createGenesisBlock() {
		return new Block(0, Date.now(), { type: "GENESIS" }, "0");
	}

	// Load blockchain từ file
	loadChain() {
		try {
			const dataDir = path.dirname(this.chainFile);
			if (!fs.existsSync(dataDir)) {
				fs.mkdirSync(dataDir, { recursive: true });
			}

			if (fs.existsSync(this.chainFile)) {
				const data = fs.readFileSync(this.chainFile, "utf8");
				const chainData = JSON.parse(data);

				return chainData.map((blockData) => {
					const block = new Block(
						blockData.index,
						blockData.timestamp,
						blockData.data,
						blockData.previousHash
					);
					block.hash = blockData.hash;
					return block;
				});
			}
			return [];
		} catch (error) {
			console.error("Error loading blockchain:", error);
			return [];
		}
	}

	// Save blockchain to file
	saveChain() {
		try {
			const dataDir = path.dirname(this.chainFile);
			if (!fs.existsSync(dataDir)) {
				fs.mkdirSync(dataDir, { recursive: true });
			}

			fs.writeFileSync(
				this.chainFile,
				JSON.stringify(this.chain, null, 2)
			);
		} catch (error) {
			console.error("Error saving blockchain:", error);
			throw error;
		}
	}

	getLatestBlock() {
		return this.chain[this.chain.length - 1];
	}

	// Thêm block mới
	addBlock(data) {
		const previousBlock = this.getLatestBlock();
		const newBlock = new Block(
			this.chain.length,
			Date.now(),
			data,
			previousBlock.hash
		);

		this.chain.push(newBlock);
		this.saveChain(); // Lưu file sau khi thêm block

		return newBlock;
	}

	// Lấy blocks theo recordId
	getBlocksByRecordId(recordId) {
		return this.chain.filter(
			(block) => block.data && block.data.recordId === recordId
		);
	}

	// Kiểm tra blockchain hợp lệ
	isChainValid() {
		for (let i = 1; i < this.chain.length; i++) {
			const currentBlock = this.chain[i];
			const previousBlock = this.chain[i - 1];

			if (currentBlock.hash !== currentBlock.calculateHash()) {
				return false;
			}
			if (currentBlock.previousHash !== previousBlock.hash) {
				return false;
			}
		}
		return true;
	}

	// Thông tin blockchain
	getChainInfo() {
		return {
			totalBlocks: this.chain.length,
			latestBlock: this.getLatestBlock(),
			isValid: this.isChainValid(),
		};
	}
}

module.exports = Blockchain;
