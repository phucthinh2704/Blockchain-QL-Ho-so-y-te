const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
	process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Store refresh tokens (in production, use Redis or database)
const refreshTokens = new Map();

// Generate tokens
const generateTokens = (user) => {
	const payload = {
		userId: user._id,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwt.sign(payload, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN,
	});

	const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
		expiresIn: JWT_REFRESH_EXPIRES_IN,
	});

	// Store refresh token
	refreshTokens.set(refreshToken, user._id.toString());

	return { accessToken, refreshToken };
};

// Register user
const register = async (req, res) => {
	try {
		const {
			email,
			password,
			name,
			role,
			phoneNumber,
			specialization,
			dateOfBirth,
		} = req.body;

		// Validate required fields
		if (!email || !password || !name || !role) {
			return res.status(400).json({
				error: "Email, password, name, and role are required",
			});
		}

		// Validate password strength
		if (password.length < 6) {
			return res.status(400).json({
				error: "Password must be at least 6 characters long",
			});
		}

		// Validate role
		if (!["patient", "doctor", "admin"].includes(role)) {
			return res.status(400).json({
				error: "Invalid role. Must be patient, doctor, or admin",
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({
			email: email.toLowerCase(),
		});

		if (existingUser) {
			return res.status(409).json({
				error: "User with this email already exists",
			});
		}

		// Hash password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create user data
		const userData = {
			email: email.toLowerCase(),
			password: hashedPassword,
			name: name.trim(),
			role,
			phoneNumber,
		};

		// Add role-specific fields
		if (role === "doctor" && specialization) {
			userData.specialization = specialization.trim();
		}
		if (role === "patient" && dateOfBirth) {
			userData.dateOfBirth = new Date(dateOfBirth);
		}

		// Create user
		const user = new User(userData);
		await user.save();

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user);

		// Remove sensitive data from response
		const userResponse = user.toObject();
		delete userResponse.password;
		delete userResponse.__v;

		res.status(201).json({
			message: "User registered successfully",
			user: userResponse,
			accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Registration error:", error);

		if (error.code === 11000) {
			return res.status(409).json({
				error: "User with this email already exists",
			});
		}

		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Login user
const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				error: "Email and password are required",
			});
		}

		// Find user
		const user = await User.findOne({ 
			email: email.toLowerCase() 
		}).select('+password'); // Include password field for comparison

		if (!user) {
			return res.status(401).json({
				error: "Invalid email or password",
			});
		}

		if (!user.isActive) {
			return res.status(401).json({
				error: "Account is deactivated",
			});
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return res.status(401).json({
				error: "Invalid email or password",
			});
		}

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user);

		// Remove sensitive data from response
		const userResponse = user.toObject();
		delete userResponse.password;
		delete userResponse.__v;

		res.json({
			message: "Login successful",
			user: userResponse,
			accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Logout
const logout = async (req, res) => {
	try {
		const { refreshToken: token } = req.body;

		if (token) {
			refreshTokens.delete(token);
		}

		res.json({
			message: "Logout successful",
		});
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Refresh token
const refreshToken = async (req, res) => {
	try {
		const { refreshToken: token } = req.body;

		if (!token) {
			return res.status(401).json({
				error: "Refresh token required",
			});
		}

		if (!refreshTokens.has(token)) {
			return res.status(403).json({
				error: "Invalid refresh token",
			});
		}

		// Verify refresh token
		jwt.verify(token, JWT_REFRESH_SECRET, async (err, decoded) => {
			if (err) {
				refreshTokens.delete(token);
				return res.status(403).json({
					error: "Invalid refresh token",
				});
			}

			// Get user
			const user = await User.findById(decoded.userId);
			if (!user || !user.isActive) {
				refreshTokens.delete(token);
				return res.status(403).json({
					error: "User not found or inactive",
				});
			}

			// Generate new tokens
			const { accessToken, refreshToken: newRefreshToken } =
				generateTokens(user);

			// Remove old refresh token and store new one
			refreshTokens.delete(token);

			res.json({
				accessToken,
				refreshToken: newRefreshToken,
			});
		});
	} catch (error) {
		console.error("Refresh token error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Change password
const changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		const userId = req.user.userId; // From JWT middleware

		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				error: "Current password and new password are required",
			});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({
				error: "New password must be at least 6 characters long",
			});
		}

		// Find user with password
		const user = await User.findById(userId).select('+password');
		if (!user) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		// Verify current password
		const isValidPassword = await bcrypt.compare(currentPassword, user.password);
		if (!isValidPassword) {
			return res.status(401).json({
				error: "Current password is incorrect",
			});
		}

		// Hash new password
		const saltRounds = 12;
		const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

		// Update password
		user.password = hashedNewPassword;
		await user.save();

		res.json({
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error("Change password error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Forgot password
const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				error: "Email is required",
			});
		}

		const user = await User.findOne({ email: email.toLowerCase() });

		if (!user) {
			// Don't reveal if user exists or not
			return res.json({
				message:
					"If an account with that email exists, a password reset link has been sent",
			});
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const resetTokenHash = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");

		// Store reset token in user document (expires in 10 minutes)
		user.passwordResetToken = resetTokenHash;
		user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
		await user.save();

		// In a real application, you would send email with reset link
		// For now, just log the token (remove in production)
		console.log(`Password reset token for ${email}: ${resetToken}`);

		res.json({
			message:
				"If an account with that email exists, a password reset link has been sent",
		});
	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Reset password
const resetPassword = async (req, res) => {
	try {
		const { token, newPassword } = req.body;

		if (!token || !newPassword) {
			return res.status(400).json({
				error: "Token and new password are required",
			});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({
				error: "New password must be at least 6 characters long",
			});
		}

		// Hash the token to compare with stored hash
		const hashedToken = crypto
			.createHash("sha256")
			.update(token)
			.digest("hex");

		// Find user with valid reset token
		const user = await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetExpires: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({
				error: "Token is invalid or has expired",
			});
		}

		// Hash new password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		// Update password and clear reset token
		user.password = hashedPassword;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save();

		res.json({
			message: "Password reset successfully",
		});
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

module.exports = {
	register,
	login,
	refreshToken,
	logout,
	changePassword,
	forgotPassword,
	resetPassword,
};