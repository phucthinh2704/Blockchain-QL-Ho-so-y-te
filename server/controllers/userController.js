const User = require("../models/User");
const bcrypt = require("bcrypt");

// Đăng ký người dùng mới
const registerUser = async (req, res) => {
    try {
        const { email, password, name, role, phoneNumber, specialization, dateOfBirth } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin bắt buộc"
            });
        }

        // Kiểm tra email đã tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email đã được sử dụng"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const userData = {
            email,
            password: hashedPassword,
            name,
            role,
            phoneNumber
        };

        // Thêm thông tin theo role
        if (role === 'doctor' && specialization) {
            userData.specialization = specialization;
        }
        if (role === 'patient' && dateOfBirth) {
            userData.dateOfBirth = new Date(dateOfBirth);
        }

        const user = new User(userData);
        await user.save();

        // Trả về thông tin user (không bao gồm password)
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: "Đăng ký thành công",
            data: userResponse
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi đăng ký người dùng",
            error: error.message
        });
    }
};

// Lấy thông tin user theo ID
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi lấy thông tin người dùng",
            error: error.message
        });
    }
};

// Lấy danh sách users
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        
        const filter = { isActive: true };
        if (role) filter.role = role;

        const users = await User.find(filter).select("-password").sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách người dùng",
            error: error.message
        });
    }
};

// Lấy danh sách bác sĩ
const getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ 
            role: "doctor", 
            isActive: true 
        }).select("name email specialization phoneNumber");

        res.json({
            success: true,
            data: doctors
        });

    } catch (error) {
        console.error("Get doctors error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách bác sĩ",
            error: error.message
        });
    }
};

// Lấy danh sách bệnh nhân
const getPatients = async (req, res) => {
    try {
        const patients = await User.find({ 
            role: "patient", 
            isActive: true 
        }).select("name email phoneNumber dateOfBirth");

        res.json({
            success: true,
            data: patients
        });

    } catch (error) {
        console.error("Get patients error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi lấy danh sách bệnh nhân",
            error: error.message
        });
    }
};

// Cần cập nhật controller để hỗ trợ phân quyền user tự cập nhật thông tin
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, phoneNumber, specialization, dateOfBirth } = req.body;

        // Kiểm tra quyền: user chỉ được cập nhật thông tin của chính họ (trừ admin)
        if (req.user.role !== 'admin' && userId !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "Bạn chỉ có thể cập nhật thông tin của chính mình"
            });
        }

        // Tìm user hiện tại
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        // Chuẩn bị dữ liệu cập nhật
        const updateData = {};
        
        if (name) updateData.name = name.trim();
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        
        // Cập nhật theo role
        if (currentUser.role === "doctor" && specialization) {
            updateData.specialization = specialization;
        }
        if (currentUser.role === "patient" && dateOfBirth) {
            updateData.dateOfBirth = new Date(dateOfBirth);
        }

        // Cập nhật user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        res.json({
            success: true,
            message: "Cập nhật thông tin thành công",
            data: updatedUser
        });

    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi cập nhật thông tin người dùng",
            error: error.message
        });
    }
};

// Xóa user (deactivate)
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy người dùng"
            });
        }

        res.json({
            success: true,
            message: "Xóa người dùng thành công",
            data: user
        });

    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi xóa người dùng",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    getUserById,
    getUsers,
    getDoctors,
    getPatients,
    updateUser,
    deleteUser
};