const express = require("express");
const router = express.Router();
const medicalController = require("../controllers/medicalController");
const { authenticateToken, authorize } = require("../middlewares/auth");

/**
 * @route POST /api/medical/records
 * @desc Create new medical record
 */
router.post(
	"/records",
	authenticateToken,
	authorize(["doctor", "hospital"]),
	medicalController.createRecord
);

/**
 * @route GET /api/medical/records
 * @desc Get medical records (patient: own records, doctor: accessible records)
 */
router.get("/records", authenticateToken, medicalController.getRecords);

/**
 * @route GET /api/medical/records/:recordId
 * @desc Get specific medical record
 */
router.get(
	"/records/:recordId",
	authenticateToken,
	medicalController.getRecordById
);

/**
 * @route PUT /api/medical/records/:recordId
 * @desc Update medical record
 */
router.put(
	"/records/:recordId",
	authenticateToken,
	authorize(["doctor", "hospital"]),
	medicalController.updateRecord
);

/**
 * @route POST /api/medical/records/:recordId/share
 * @desc Share medical record with another user
 */
router.post(
	"/records/:recordId/share",
	authenticateToken,
	authorize(["patient", "doctor"]),
	medicalController.shareRecord
);

/**
 * @route DELETE /api/medical/records/:recordId/access/:userId
 * @desc Revoke access to medical record
 */
router.delete(
	"/records/:recordId/access/:userId",
	authenticateToken,
	medicalController.revokeAccess
);

/**
 * @route GET /api/medical/records/:recordId/access
 * @desc Get access list for a record
 */
router.get(
	"/records/:recordId/access",
	authenticateToken,
	authorize(["patient", "doctor"]),
	medicalController.getRecordAccess
);

/**
 * @route GET /api/medical/patient/:patientId/records
 * @desc Get patient's medical history (for doctors)
 */
router.get(
	"/patient/:patientId/records",
	authenticateToken,
	authorize(["doctor", "hospital"]),
	medicalController.getPatientRecords
);

module.exports = router;
