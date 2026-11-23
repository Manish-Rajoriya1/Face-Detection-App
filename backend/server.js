
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");

const employeeRoutes = require("./routes/employees");
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const attendanceSettingsRoutes = require("./routes/attendanceSettings");
const leaveRoutes = require("./routes/leave");

const notificationRoutes = require("./routes/notifications");
const app = express();

// MIDDLEWARE
app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json({ limit: "10mb" }));

// BASIC ROUTES
app.get("/", (req, res) => {
    res.json({
        message: "Face Attendance Backend is running",
        status: "success"
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "healthy"
    });
});

// AUTH ROUTES
app.use("/api/auth", authRoutes);

// ADMIN PROFILE IMAGE STORAGE
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// EMPLOYEE ROUTES
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance-settings", attendanceSettingsRoutes);
app.use("/api/leave", leaveRoutes);

app.use("/api/notifications", notificationRoutes);

// SERVER CONFIG
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env");
    process.exit(1);
}

// MONGODB + SERVER
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, "127.0.0.1", () => {
            console.log(
                `Backend running on http://localhost:${PORT}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    });
