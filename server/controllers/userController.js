const User = require("../models/User");

// Get current user profile
const getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select("-__v");

		if (!user) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		res.json({
			user,
		});
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Update user profile
const updateProfile = async (req, res) => {
	try {
		const { name, phoneNumber, specialization, dateOfBirth } = req.body;
		const userId = req.user.userId;

		// Get current user to check role
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		// Prepare update data
		const updateData = {};
		
		if (name !== undefined) {
			updateData.name = name.trim();
		}
		
		if (phoneNumber !== undefined) {
			updateData.phoneNumber = phoneNumber;
		}

		// Role-specific updates
		if (currentUser.role === "doctor" && specialization !== undefined) {
			updateData.specialization = specialization;
		}

		if (currentUser.role === "patient" && dateOfBirth !== undefined) {
			updateData.dateOfBirth = new Date(dateOfBirth);
		}

		// Update user
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			updateData,
			{ new: true, runValidators: true }
		).select("-__v");

		if (!updatedUser) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		res.json({
			message: "Profile updated successfully",
			user: updatedUser,
		});
	} catch (error) {
		console.error("Update profile error:", error);
		
		if (error.name === "ValidationError") {
			return res.status(400).json({
				error: "Validation error",
				details: Object.values(error.errors).map(err => err.message),
			});
		}

		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Get list of doctors (for patients to browse)
const getDoctors = async (req, res) => {
	try {
		const { page = 1, limit = 10, specialization } = req.query;
		const skip = (page - 1) * limit;

		// Build query
		const query = { 
			role: "doctor", 
			isActive: true 
		};

		if (specialization) {
			query.specialization = { $regex: specialization, $options: "i" };
		}

		// Get doctors with pagination
		const doctors = await User.find(query)
			.select("name email specialization phoneNumber createdAt")
			.sort({ name: 1 })
			.skip(skip)
			.limit(parseInt(limit));

		// Get total count for pagination
		const total = await User.countDocuments(query);

		res.json({
			doctors,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / limit),
				total,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Get doctors error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Get patients list (for doctors)
const getPatients = async (req, res) => {
	try {
		const { page = 1, limit = 10, search } = req.query;
		const skip = (page - 1) * limit;

		// Build query
		const query = { 
			role: "patient", 
			isActive: true 
		};

		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
			];
		}

		// Get patients with pagination
		const patients = await User.find(query)
			.select("name email phoneNumber dateOfBirth createdAt")
			.sort({ name: 1 })
			.skip(skip)
			.limit(parseInt(limit));

		// Get total count for pagination
		const total = await User.countDocuments(query);

		res.json({
			patients,
			pagination: {
				current: parseInt(page),
				pages: Math.ceil(total / limit),
				total,
				limit: parseInt(limit),
			},
		});
	} catch (error) {
		console.error("Get patients error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Get user by ID (restricted access)
const getUserById = async (req, res) => {
	try {
		const { userId } = req.params;
		const requestingUser = req.user;

		// Validate ObjectId format
		if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				error: "Invalid user ID format",
			});
		}

		// Find user
		const user = await User.findById(userId).select("-__v");

		if (!user) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		// Check permissions
		let allowedFields;
		
		if (requestingUser.role === "admin") {
			// Admin can see all fields
			allowedFields = user.toObject();
		} else if (requestingUser.role === "doctor") {
			// Doctors can see patient information
			if (user.role === "patient") {
				allowedFields = {
					_id: user._id,
					name: user.name,
					email: user.email,
					phoneNumber: user.phoneNumber,
					dateOfBirth: user.dateOfBirth,
					role: user.role,
					createdAt: user.createdAt,
				};
			} else {
				// Doctors can see basic info of other doctors
				allowedFields = {
					_id: user._id,
					name: user.name,
					email: user.email,
					specialization: user.specialization,
					role: user.role,
				};
			}
		} else {
			return res.status(403).json({
				error: "Insufficient permissions",
			});
		}

		res.json({
			user: allowedFields,
		});
	} catch (error) {
		console.error("Get user by ID error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Get user statistics (bonus endpoint for admin)
const getUserStats = async (req, res) => {
	try {
		// Only admin can access this
		if (req.user.role !== "admin") {
			return res.status(403).json({
				error: "Admin access required",
			});
		}

		const stats = await User.aggregate([
			{
				$group: {
					_id: "$role",
					count: { $sum: 1 },
					active: {
						$sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
					},
				},
			},
		]);

		const totalUsers = await User.countDocuments();
		const activeUsers = await User.countDocuments({ isActive: true });

		res.json({
			stats: {
				total: totalUsers,
				active: activeUsers,
				inactive: totalUsers - activeUsers,
				byRole: stats,
			},
		});
	} catch (error) {
		console.error("Get user stats error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Deactivate user (admin only)
const deactivateUser = async (req, res) => {
	try {
		const { userId } = req.params;

		// Only admin can deactivate users
		if (req.user.role !== "admin") {
			return res.status(403).json({
				error: "Admin access required",
			});
		}

		// Validate ObjectId format
		if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				error: "Invalid user ID format",
			});
		}

		// Cannot deactivate self
		if (userId === req.user.userId) {
			return res.status(400).json({
				error: "Cannot deactivate your own account",
			});
		}

		const user = await User.findByIdAndUpdate(
			userId,
			{ isActive: false },
			{ new: true }
		).select("-__v");

		if (!user) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		res.json({
			message: "User deactivated successfully",
			user,
		});
	} catch (error) {
		console.error("Deactivate user error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

// Activate user (admin only)
const activateUser = async (req, res) => {
	try {
		const { userId } = req.params;

		// Only admin can activate users
		if (req.user.role !== "admin") {
			return res.status(403).json({
				error: "Admin access required",
			});
		}

		// Validate ObjectId format
		if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				error: "Invalid user ID format",
			});
		}

		const user = await User.findByIdAndUpdate(
			userId,
			{ isActive: true },
			{ new: true }
		).select("-__v");

		if (!user) {
			return res.status(404).json({
				error: "User not found",
			});
		}

		res.json({
			message: "User activated successfully",
			user,
		});
	} catch (error) {
		console.error("Activate user error:", error);
		res.status(500).json({
			error: "Internal server error",
		});
	}
};

module.exports = {
	getProfile,
	updateProfile,
	getDoctors,
	getPatients,
	getUserById,
	getUserStats,
	deactivateUser,
	activateUser,
};