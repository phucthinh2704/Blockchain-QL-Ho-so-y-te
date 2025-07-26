const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const initRoutes = require("./routes");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const rateLimit = require('express-rate-limit');
require("dotenv").config();
const db = require("./config/database");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Connect to database
db.connectDB();

// Routes
initRoutes(app);

// Start server
app.listen(PORT, () => {
	console.log(`🏥 Medical Records Blockchain Server running on port http://localhost:${PORT}`);
});
