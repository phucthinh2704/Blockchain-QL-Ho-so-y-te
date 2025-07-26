import {
	Activity,
	AlertCircle,
	Calendar,
	CheckCircle,
	Eye,
	EyeOff,
	Heart,
	Lock,
	Mail,
	Phone,
	Shield,
	Stethoscope,
	User,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiLogin, apiRegister } from "../apis/auth";

// Di chuyển component InputField ra ngoài
const InputField = ({ icon: Icon, error, ...props }) => (
	<div className="relative">
		<Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
		<input
			{...props}
			className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
				error
					? "border-red-300 focus:border-red-500 bg-red-50"
					: "border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300"
			}`}
		/>
		{error && (
			<div className="flex items-center mt-1 text-red-500 text-sm">
				<AlertCircle className="w-4 h-4 mr-1" />
				{error}
			</div>
		)}
	</div>
);

// Di chuyển component PasswordField ra ngoài
const PasswordField = ({
	name,
	placeholder,
	value,
	onChange,
	error,
	showPassword,
	toggleShow,
}) => (
	<div className="relative">
		<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
		<input
			type={showPassword ? "text" : "password"}
			name={name}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 ${
				error
					? "border-red-300 focus:border-red-500 bg-red-50"
					: "border-gray-200 focus:border-blue-500 bg-white hover:border-gray-300"
			}`}
		/>
		<button
			type="button"
			onClick={toggleShow}
			className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
			{showPassword ? (
				<EyeOff className="w-5 h-5" />
			) : (
				<Eye className="w-5 h-5" />
			)}
		</button>
		{error && (
			<div className="flex items-center mt-1 text-red-500 text-sm">
				<AlertCircle className="w-4 h-4 mr-1" />
				{error}
			</div>
		)}
	</div>
);

const MedicalAuthSystem = () => {
	const [activeTab, setActiveTab] = useState("login");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		name: "",
		password: "",
		confirmPassword: "",
		role: "patient",
		phoneNumber: "",
		specialization: "",
		dateOfBirth: "",
	});

	const [errors, setErrors] = useState({});

	const navigate = useNavigate();

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value,
		});

		// Clear error when user starts typing
		if (errors[name]) {
			setErrors({
				...errors,
				[name]: "",
			});
		}
	};

	const validateForm = (isLogin = false) => {
		const newErrors = {};

		if (!isLogin) {
			if (!formData.name.trim()) newErrors.name = "Họ và tên là bắt buộc";
			if (!formData.email.trim()) newErrors.email = "Email là bắt buộc";
			if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc";
			if (formData.password.length < 6)
				newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
			if (formData.password !== formData.confirmPassword) {
				newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
			}
			if (!formData.phoneNumber.trim())
				newErrors.phoneNumber = "Số điện thoại là bắt buộc";
		} else {
			if (!formData.email.trim()) newErrors.email = "Email là bắt buộc";
			if (!formData.password) newErrors.password = "Mật khẩu là bắt buộc";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const user = JSON.parse(localStorage.getItem("user"));
	if (user) {
		return <Navigate to="/" />;
	}

	const handleLogin = async (e) => {
		e.preventDefault();
		if (!validateForm(true)) return;

		console.log("Logging in with data:", formData);
		setIsLoading(true);
		setTimeout(async () => {
			const response = await apiLogin(formData);
			if (response.message) {
				Swal.fire({
					icon: "success",
					title: "Đăng nhập thành công",
					text: response.message,
				});
				localStorage.setItem("user", JSON.stringify(response.user));
				navigate("/");
			}
			setIsLoading(false);
		}, 200);
	};

	const handleRegister = async (e) => {
		e.preventDefault();
		if (!validateForm(false)) return;

		setIsLoading(true);
		setTimeout(async () => {
			const response = await apiRegister(formData);
			if (response.message) {
				Swal.fire({
					icon: "success",
					title: "Đăng ký thành công",
					text: response.message,
				});
			} else {
				Swal.fire({
					icon: "error",
					title: "Đăng ký thất bại",
					text: response.error || "Vui lòng thử lại sau",
				});
			}
			setIsLoading(false);
		}, 200);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
			{/* Animated Background Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-full opacity-10 animate-pulse"></div>
				<div className="absolute top-40 right-20 w-16 h-16 bg-cyan-500 rounded-full opacity-10 animate-bounce"></div>
				<div className="absolute bottom-20 left-20 w-24 h-24 bg-green-500 rounded-full opacity-10 animate-pulse"></div>
				<div className="absolute bottom-40 right-10 w-12 h-12 bg-blue-400 rounded-full opacity-10 animate-bounce"></div>
			</div>

			{/* Main Container */}
			<div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden relative backdrop-blur-sm">
				{/* Enhanced Header */}
				<div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 px-8 py-8 text-white relative overflow-hidden">
					<div className="absolute inset-0 opacity-20">
						<Heart className="absolute top-3 right-12 w-8 h-8 animate-pulse" />
						<Activity className="absolute bottom-3 left-16 w-6 h-6 animate-bounce" />
						<Shield className="absolute top-6 left-1/3 w-7 h-7 animate-pulse" />
						<Stethoscope className="absolute bottom-4 right-1/4 w-6 h-6 animate-bounce" />
					</div>
					<div className="relative z-10">
						<h1 className="text-4xl font-bold mb-3 flex items-center gap-4">
							<div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
								<Stethoscope className="w-10 h-10" />
							</div>
							MedChain Portal
						</h1>
						<p className="text-blue-100 text-lg">
							Hệ thống quản lý hồ sơ y tế an toàn với công nghệ
							Blockchain
						</p>
					</div>
				</div>

				<div className="flex min-h-[500px]">
					{/* Enhanced Left Side - Info Panel */}
					<div className="w-2/5 bg-gradient-to-b from-gray-50 to-gray-100 p-8 flex flex-col justify-center">
						<div className="space-y-8">
							<div className="text-center mb-8">
								<h2 className="text-2xl font-bold text-gray-800 mb-2">
									Tại sao chọn MedChain?
								</h2>
								<div className="w-16 h-1 bg-blue-500 mx-auto rounded-full"></div>
							</div>

							<div className="space-y-6">
								<div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
									<div className="bg-blue-100 p-3 rounded-xl shrink-0">
										<Shield className="w-6 h-6 text-blue-600" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-800 mb-1">
											Bảo mật tuyệt đối
										</h3>
										<p className="text-sm text-gray-600">
											Công nghệ Blockchain đảm bảo dữ liệu
											không thể bị thay đổi
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
									<div className="bg-green-100 p-3 rounded-xl shrink-0">
										<Heart className="w-6 h-6 text-green-600" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-800 mb-1">
											Chăm sóc toàn diện
										</h3>
										<p className="text-sm text-gray-600">
											Hồ sơ y tế điện tử tích hợp đầy đủ
											thông tin
										</p>
									</div>
								</div>

								<div className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
									<div className="bg-purple-100 p-3 rounded-xl shrink-0">
										<Activity className="w-6 h-6 text-purple-600" />
									</div>
									<div>
										<h3 className="font-semibold text-gray-800 mb-1">
											Theo dõi thời gian thực
										</h3>
										<p className="text-sm text-gray-600">
											Cập nhật tình trạng sức khỏe liên
											tục
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Enhanced Right Side - Auth Forms */}
					<div className="w-3/5 p-8">
						{/* Enhanced Tab Navigation */}
						<div className="flex bg-gray-100 rounded-2xl p-1 mb-8 shadow-inner">
							<button
								onClick={() => {
									setActiveTab("login");
									setFormData({
										email: "",
										name: "",
										password: "",
										confirmPassword: "",
										role: "patient",
										phoneNumber: "",
										specialization: "",
										dateOfBirth: "",
									});
								}}
								className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
									activeTab === "login"
										? "bg-white text-blue-600 shadow-lg transform scale-105"
										: "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
								}`}>
								<User className="w-5 h-5 inline mr-2" />
								Đăng nhập
							</button>
							<button
								onClick={() => {
									setActiveTab("register");
									setFormData({
										email: "",
										name: "",
										password: "",
										confirmPassword: "",
										role: "patient",
										phoneNumber: "",
										specialization: "",
										dateOfBirth: "",
									});
								}}
								className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all duration-300 ${
									activeTab === "register"
										? "bg-white text-blue-600 shadow-lg transform scale-105"
										: "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
								}`}>
								<UserCheck className="w-5 h-5 inline mr-2" />
								Đăng ký
							</button>
						</div>

						{/* Login Form */}
						{activeTab === "login" && (
							<div className="space-y-6">
								<div className="space-y-5">
									<InputField
										icon={Mail}
										type="email"
										name="email"
										placeholder="Nhập địa chỉ email"
										value={formData.email}
										onChange={handleInputChange}
										error={errors.email}
										required
									/>
									<PasswordField
										name="password"
										placeholder="Nhập mật khẩu"
										value={formData.password}
										onChange={handleInputChange}
										error={errors.password}
										showPassword={showPassword}
										toggleShow={() =>
											setShowPassword(!showPassword)
										}
									/>

									<button
										type="submit"
										disabled={isLoading}
										onClick={handleLogin}
										className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
										{isLoading ? (
											<div className="flex items-center justify-center">
												<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
												Đang đăng nhập...
											</div>
										) : (
											"Đăng nhập"
										)}
									</button>
								</div>

								<div className="text-center">
									<button
										type="button"
										className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
										Quên mật khẩu?
									</button>
								</div>
							</div>
						)}

						{/* Register Form */}
						{activeTab === "register" && (
							<div className="space-y-5">
								<div className="grid grid-cols-2 gap-4">
									<InputField
										icon={User}
										type="text"
										name="name"
										placeholder="Họ và tên"
										value={formData.name}
										onChange={handleInputChange}
										error={errors.name}
										required
									/>
									<InputField
										icon={Mail}
										type="email"
										name="email"
										placeholder="Email"
										value={formData.email}
										onChange={handleInputChange}
										error={errors.email}
										required
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<PasswordField
										name="password"
										placeholder="Mật khẩu"
										value={formData.password}
										onChange={handleInputChange}
										error={errors.password}
										showPassword={showPassword}
										toggleShow={() =>
											setShowPassword(!showPassword)
										}
									/>
									<PasswordField
										name="confirmPassword"
										placeholder="Xác nhận mật khẩu"
										value={formData.confirmPassword}
										onChange={handleInputChange}
										error={errors.confirmPassword}
										showPassword={showConfirmPassword}
										toggleShow={() =>
											setShowConfirmPassword(
												!showConfirmPassword
											)
										}
									/>
								</div>

								<InputField
									icon={Phone}
									type="tel"
									name="phoneNumber"
									placeholder="Số điện thoại"
									value={formData.phoneNumber}
									onChange={handleInputChange}
									error={errors.phoneNumber}
									required
								/>

								<InputField
									icon={Calendar}
									type="date"
									name="dateOfBirth"
									placeholder="Ngày sinh"
									value={formData.dateOfBirth}
									onChange={handleInputChange}
									error={errors.dateOfBirth}
								/>

								<button
									type="submit"
									disabled={isLoading}
									onClick={handleRegister}
									className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
									{isLoading ? (
										<div className="flex items-center justify-center">
											<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
											Đang tạo tài khoản...
										</div>
									) : (
										<div className="flex items-center justify-center">
											<CheckCircle className="w-5 h-5 mr-2" />
											Tạo tài khoản
										</div>
									)}
								</button>

								<div className="text-center text-sm text-gray-600">
									Bằng cách đăng ký, bạn đồng ý với{" "}
									<button
										type="button"
										className="text-blue-600 hover:text-blue-700 font-medium">
										Điều khoản sử dụng
									</button>{" "}
									và{" "}
									<button
										type="button"
										className="text-blue-600 hover:text-blue-700 font-medium">
										Chính sách bảo mật
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MedicalAuthSystem;
