const express = require("express");
const router = express.Router();
const blockchainController = require("../controllers/blockchainController");
const { authenticateToken, authorize } = require("../middlewares/auth");

/**
 * @route GET /api/blockchain/info
 * @desc Get blockchain information
 */
router.get("/info", authenticateToken, blockchainController.getBlockchainInfo);

/**
 * @route GET /api/blockchain/verify/:recordId
 * @desc Verify record integrity on blockchain
 */
router.get(
	"/verify/:recordId",
	authenticateToken,
	blockchainController.verifyRecord
);

/**
 * @route GET /api/blockchain/history/:recordId
 * @desc Get transaction history for a record
 */
router.get(
	"/history/:recordId",
	authenticateToken,
	blockchainController.getRecordHistory
);

/**
 * @route GET /api/blockchain/transactions
 * @desc Get user's transaction history
 */
router.get(
	"/transactions",
	authenticateToken,
	blockchainController.getUserTransactions
);

/**
 * @route GET /api/blockchain/block/:blockHash
 * @desc Get block details by hash
 */
router.get(
	"/block/:blockHash",
	authenticateToken,
	authorize(["doctor", "admin"]),
	blockchainController.getBlockByHash
);

/**
 * @route POST /api/blockchain/validate
 * @desc Validate entire blockchain integrity
 */
router.post(
	"/validate",
	authenticateToken,
	authorize(["admin"]),
	blockchainController.validateBlockchain
);

module.exports = router;
