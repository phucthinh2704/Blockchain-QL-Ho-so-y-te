const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post('/logout', authController.logout);
// router.post('/refresh-token', refreshToken);
// router.post('/change-password', authMiddleware, changePassword); // cần middleware
// router.post('/forgot-password', forgotPassword);
// router.post('/reset-password', resetPassword);

module.exports = router;
