const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const {
	registerUser,
	getUserById,
	getUsers,
	getDoctors,
	getPatients,
	updateUser,
	deleteUser,
} = require("../controllers/userController");

// 1. Đăng ký user mới (public - không cần auth)
router.post("/register", registerUser);

// 2. Lấy danh sách users (chỉ admin)
router.get("/", authenticateToken, authorize(["admin"]), getUsers);

// 3. Lấy danh sách bác sĩ (patient, doctor, admin có thể xem)
router.get(
	"/doctors",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	getDoctors
);

// 4. Lấy danh sách bệnh nhân (chỉ doctor và admin)
router.get(
	"/patients",
	authenticateToken,
	authorize(["doctor", "admin"]),
	getPatients
);

// 5. Lấy thông tin user theo ID (tất cả roles đã đăng nhập)
router.get(
	"/:userId",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	getUserById
);

// 6. Cập nhật thông tin user (user chính họ hoặc admin)
router.put(
	"/:userId",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	updateUser
);

// 7. Xóa user (chỉ admin)
router.delete("/:userId", authenticateToken, authorize(["admin"]), deleteUser);

module.exports = router;
