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

// ===============================
// CORS
// ===============================

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without origin
            // such as Postman/server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        },
        credentials: true
    })
);

// ===============================
// BODY PARSER
// ===============================

app.use(express.json({ limit: "10mb" }));

// ===============================
// BASIC ROUTES
// ===============================

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

// ===============================
// AUTH ROUTES
// ===============================

app.use("/api/auth", authRoutes);

// ===============================
// UPLOADS
// ===============================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// ===============================
// API ROUTES
// ===============================

app.use("/api/employees", employeeRoutes);

app.use(
    "/api/attendance",
    attendanceRoutes
);

app.use(
    "/api/attendance-settings",
    attendanceSettingsRoutes
);

app.use(
    "/api/leave",
    leaveRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

// ===============================
// SERVER CONFIG
// ===============================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is missing in .env");
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env");
    process.exit(1);
}

// ===============================
// MONGODB + SERVER
// ===============================

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log(
            "MongoDB connected successfully"
        );

        app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `Backend running on port ${PORT}`
                );
            }
        );
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    });