const Block = require("./Block");

class Blockchain {
	constructor() {
		this.chain = [this.createGenesisBlock()];
		this.difficulty = 2;
		this.pendingTransactions = [];
	}

	createGenesisBlock() {
		return new Block(0, Date.now(), "Genesis Block", "0");
	}

	getLatestBlock() {
		return this.chain[this.chain.length - 1];
	}

	addBlock(data) {
		const previousBlock = this.getLatestBlock();
		const newBlock = new Block(
			this.chain.length,
			Date.now(),
			data,
			previousBlock.hash
		);
		newBlock.mineBlock(this.difficulty);
		this.chain.push(newBlock);
		return newBlock;
	}

	// Validate blockchain integrity
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

	// Get block by hash
	getBlockByHash(hash) {
		return this.chain.find((block) => block.hash === hash);
	}

	// Get blocks by data content (medical records)
	getBlocksByRecordId(recordId) {
		return this.chain.filter(
			(block) =>
				block.data &&
				typeof block.data === "object" &&
				block.data.recordId === recordId
		);
	}
}

module.exports = Blockchain;
