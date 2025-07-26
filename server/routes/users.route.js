const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticateToken, authorize } = require("../middlewares/auth");


/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 */
router.get("/profile", authenticateToken, userController.getProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 */
router.put("/profile", authenticateToken, userController.updateProfile);

/**
 * @route GET /api/users/doctors
 * @desc Get list of doctors (for patients)
 */
router.get("/doctors", authenticateToken, userController.getDoctors);

/**
 * @route GET /api/users/patients
 * @desc Get doctor's patients list
 */
router.get(
	"/patients",
	authenticateToken,
	authorize(["doctor", "hospital"]),
	userController.getPatients
);

/**
 * @route GET /api/users/:userId
 * @desc Get user details (restricted)
 */
router.get(
	"/:userId",
	authenticateToken,
	authorize(["doctor", "admin"]),
	userController.getUserById
);

module.exports = router;
