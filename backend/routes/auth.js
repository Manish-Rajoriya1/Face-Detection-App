
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Employee = require("../models/Employee");

const Admin = require("../models/Admin");

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================
// IMAGE UPLOAD CONFIGURATION
// =====================================

const uploadDirectory = path.join(
    __dirname,
    "../uploads/admin"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

        if (!allowedExtensions.includes(extension)) {
            return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
        }

        cb(null, `admin-${req.user.id}-${Date.now()}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG and WEBP images are allowed"));
        }

        cb(null, true);
    }
});

const adminOnly = [
    verifyToken,
    allowRoles("admin")
];

// =====================================
// ADMIN LOGIN
// =====================================

router.post("/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const admin = await Admin.findOne({
            email: email.toLowerCase().trim()
        });

        if (!admin) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            admin.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: admin._id,
                email: admin.email,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Admin login successful",
            token,
            user: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                profileImage: admin.profileImage
            }
        });

    } catch (error) {
        console.error("Admin login error:", error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});

// =====================================
// GET ADMIN PROFILE
// =====================================

router.get("/admin/profile", ...adminOnly, async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id)
            .select("-password")
            .lean();

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        res.json(admin);

    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch profile"
        });
    }
});

// =====================================
// UPDATE ADMIN PROFILE
// =====================================

router.put("/admin/profile", ...adminOnly, async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({
                message: "Name and email are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingAdmin = await Admin.findOne({
            email: normalizedEmail,
            _id: { $ne: req.user.id }
        });

        if (existingAdmin) {
            return res.status(409).json({
                message: "This email is already in use"
            });
        }

        const admin = await Admin.findByIdAndUpdate(
            req.user.id,
            {
                name: name.trim(),
                email: normalizedEmail
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!admin) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        res.json({
            message: "Profile updated successfully",
            admin
        });

    } catch (error) {
        console.error("Profile update error:", error);

        res.status(500).json({
            message: "Profile update failed"
        });
    }
});

// =====================================
// UPLOAD ADMIN PROFILE PHOTO
// =====================================

router.post(
    "/admin/profile/photo",
    ...adminOnly,
    (req, res, next) => {
        upload.single("profileImage")(req, res, (error) => {
            if (error) {
                return res.status(400).json({
                    message: error.message
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    message: "Please select a profile image"
                });
            }

            const admin = await Admin.findById(req.user.id);

            if (!admin) {
                fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    message: "Admin not found"
                });
            }

            const oldImage = admin.profileImage;

            admin.profileImage =
                `/uploads/admin/${req.file.filename}`;

            console.log("Uploaded File:", req.file);
            console.log("Saved Image Path:", admin.profileImage);

            await admin.save();



            // Delete previous image after successful save
            if (oldImage?.startsWith("/uploads/admin/")) {
                const oldPath = path.join(
                    __dirname,
                    "..",
                    oldImage
                );

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            res.json({
                message: "Profile photo updated successfully",
                profileImage: admin.profileImage
            });

        } catch (error) {
            console.error("Photo upload error:", error);

            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                message: "Profile photo upload failed"
            });
        }
    }
);

// =====================================
// REMOVE ADMIN PROFILE PHOTO
// =====================================

router.delete(
    "/admin/profile/photo",
    ...adminOnly,
    async (req, res) => {
        try {
            const admin = await Admin.findById(req.user.id);

            if (!admin) {
                return res.status(404).json({
                    message: "Admin not found"
                });
            }

            const oldImage = admin.profileImage;

            admin.profileImage = "";
            await admin.save();

            if (oldImage?.startsWith("/uploads/admin/")) {
                const oldPath = path.join(
                    __dirname,
                    "..",
                    oldImage
                );

                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            res.json({
                message: "Profile photo removed successfully"
            });

        } catch (error) {
            res.status(500).json({
                message: "Unable to remove profile photo"
            });
        }
    }
);

// =====================================
// CHANGE ADMIN PASSWORD
// =====================================

router.put(
    "/admin/change-password",
    ...adminOnly,
    async (req, res) => {
        try {
            const {
                currentPassword,
                newPassword,
                confirmPassword
            } = req.body;

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    message: "All password fields are required"
                });
            }

            if (newPassword.length < 12) {
                return res.status(400).json({
                    message: "New password must be at least 12 characters"
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    message: "New passwords do not match"
                });
            }

            const admin = await Admin.findById(req.user.id);

            if (!admin) {
                return res.status(404).json({
                    message: "Admin not found"
                });
            }

            const isMatch = await bcrypt.compare(
                currentPassword,
                admin.password
            );

            if (!isMatch) {
                return res.status(400).json({
                    message: "Current password is incorrect"
                });
            }

            admin.password = await bcrypt.hash(newPassword, 12);

            await admin.save();

            res.json({
                message: "Password changed successfully. Please login again."
            });

        } catch (error) {
            console.error("Password change error:", error);

            res.status(500).json({
                message: "Password change failed"
            });
        }
    }
);





// ==========================================
// EMPLOYEE LOGIN
// ==========================================

router.post("/employee/login", async (req, res) => {
    try {
        const { employeeId, password } = req.body;

        if (!employeeId || !password) {
            return res.status(400).json({
                message: "Employee ID and password are required"
            });
        }

        const employee = await Employee.findOne({
            employeeId: employeeId.trim().toUpperCase()
        }).select("+password");

        if (!employee) {
            return res.status(401).json({
                message: "Invalid Employee ID or password"
            });
        }

        if (!employee.isActive) {
            return res.status(403).json({
                message: "Your account is inactive. Contact Admin."
            });
        }

        if (!employee.password) {
            return res.status(401).json({
                message: "Login account not created. Contact Admin."
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            employee.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid Employee ID or password"
            });
        }

        const token = jwt.sign(
            {
                id: employee._id,
                employeeId: employee.employeeId,
                role: "employee"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Employee login successful",
            token,
            mustChangePassword: employee.mustChangePassword,
            user: {
                id: employee._id,
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                profileImage: employee.profileImage,
                role: "employee"
            }
        });

    } catch (error) {
        console.error("Employee login error:", error);

        res.status(500).json({
            message: "Employee login failed"
        });
    }
});


// ==========================================
// EMPLOYEE CHANGE PASSWORD
// ==========================================

router.put(
    "/employee/change-password",
    verifyToken,
    allowRoles("employee"),
    async (req, res) => {
        try {
            const {
                currentPassword,
                newPassword,
                confirmPassword
            } = req.body;

            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    message: "All password fields are required"
                });
            }

            if (newPassword.length < 12) {
                return res.status(400).json({
                    message: "Password must contain at least 12 characters"
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    message: "New passwords do not match"
                });
            }

            if (currentPassword === newPassword) {
                return res.status(400).json({
                    message: "New password must be different"
                });
            }

            const employee = await Employee.findById(
                req.user.id
            ).select("+password");

            if (!employee || !employee.isActive) {
                return res.status(403).json({
                    message: "Employee account is unavailable"
                });
            }

            const isMatch = await bcrypt.compare(
                currentPassword,
                employee.password
            );

            if (!isMatch) {
                return res.status(400).json({
                    message: "Current password is incorrect"
                });
            }

            employee.password = await bcrypt.hash(
                newPassword,
                12
            );

            employee.mustChangePassword = false;

            await employee.save();

            res.status(200).json({
                message: "Password changed successfully. Please login again."
            });

        } catch (error) {
            console.error("Employee password error:", error);

            res.status(500).json({
                message: "Password change failed"
            });
        }
    }
);


module.exports = router;
