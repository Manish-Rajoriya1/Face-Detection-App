const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Employee = require("../models/Employee");

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// EMPLOYEE PROFILE IMAGE UPLOAD
// ======================================================

const employeeUploadDirectory = path.join(
    __dirname,
    "../uploads/employees"
);

fs.mkdirSync(employeeUploadDirectory, {
    recursive: true
});

const employeeImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, employeeUploadDirectory);
    },

    filename: (req, file, cb) => {
        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ];

        if (!allowedExtensions.includes(extension)) {
            return cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed"
                )
            );
        }

        cb(
            null,
            `employee-${req.user.id}-${Date.now()}${extension}`
        );
    }
});

const employeeImageUpload = multer({
    storage: employeeImageStorage,

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
            return cb(
                new Error(
                    "Only JPG, PNG and WEBP images are allowed"
                )
            );
        }

        cb(null, true);
    }
});

// ======================================================
// ADMIN AUTH
// ======================================================

const adminOnly = [
    verifyToken,
    allowRoles("admin")
];

// ======================================================
// PROFILE IMAGE UPLOAD
// ======================================================

const uploadDir = path.join(
    __dirname,
    "../uploads/employees"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const extension =
            path.extname(file.originalname).toLowerCase();

        const employeeId =
            (req.body.employeeId || "employee")
                .toString()
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9_-]/g, "_");

        cb(
            null,
            `${employeeId}-${Date.now()}${extension}`
        );
    }
});

const fileFilter = (req, file, cb) => {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed"
            )
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// ======================================================
// HELPER
// ======================================================

const deleteImageFile = (imagePath) => {

    if (!imagePath) return;

    try {

        const cleanPath = imagePath
            .replace(/^\/+/, "")
            .replace(/^uploads[\\/]/, "");

        const fullPath = path.join(
            __dirname,
            "../uploads",
            cleanPath
        );

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

    } catch (error) {
        console.error(
            "Image delete error:",
            error.message
        );
    }
};

// ======================================================
// ADD EMPLOYEE
// ======================================================

router.post(
    "/",
    ...adminOnly,
    upload.single("profileImage"),
    async (req, res) => {

        try {

            const {
                employeeId,
                name,
                email,
                department
            } = req.body;

            if (
                !employeeId?.trim() ||
                !name?.trim() ||
                !email?.trim() ||
                !department?.trim()
            ) {

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message:
                        "All employee details are required"
                });
            }

            const normalizedEmployeeId =
                employeeId.trim().toUpperCase();

            const normalizedEmail =
                email.trim().toLowerCase();

            // ==================================================
            // DUPLICATE CHECK
            // ==================================================

            const existingEmployee =
                await Employee.findOne({
                    $or: [
                        {
                            employeeId:
                                normalizedEmployeeId
                        },
                        {
                            email:
                                normalizedEmail
                        }
                    ]
                });

            if (existingEmployee) {

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(409).json({
                    message:
                        "Employee ID or email already exists"
                });
            }

            // ==================================================
            // TEMP PASSWORD
            // ==================================================

            const temporaryPassword =
                crypto
                    .randomBytes(12)
                    .toString("base64url");

            const hashedPassword =
                await bcrypt.hash(
                    temporaryPassword,
                    12
                );

            // ==================================================
            // PROFILE IMAGE
            // ==================================================

            const profileImage =
                req.file
                    ? `/uploads/employees/${req.file.filename}`
                    : "";

            // ==================================================
            // CREATE EMPLOYEE
            // ==================================================

            const employee =
                await Employee.create({

                    employeeId:
                        normalizedEmployeeId,

                    name:
                        name.trim(),

                    email:
                        normalizedEmail,

                    department:
                        department.trim(),

                    profileImage,

                    password:
                        hashedPassword,

                    mustChangePassword:
                        true,

                    isActive:
                        true,

                    faceEncodings:
                        []
                });

            return res.status(201).json({

                message:
                    "Employee and login account created successfully",

                employee: {

                    id:
                        employee._id,

                    employeeId:
                        employee.employeeId,

                    name:
                        employee.name,

                    email:
                        employee.email,

                    department:
                        employee.department,

                    profileImage:
                        employee.profileImage,

                    isActive:
                        employee.isActive,

                    faceRegistered:
                        employee.faceEncodings.length > 0
                },

                temporaryPassword
            });

        } catch (error) {

            console.error(
                "Add employee error:",
                error
            );

            if (req.file) {

                try {

                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }

                } catch (fileError) {
                    console.error(
                        "Uploaded file cleanup error:",
                        fileError.message
                    );
                }
            }

            if (error.code === 11000) {

                return res.status(409).json({
                    message:
                        "Employee ID or email already exists"
                });
            }

            return res.status(500).json({
                message:
                    "Failed to create employee account"
            });
        }
    }
);

// ======================================================
// GET ALL EMPLOYEES
//
// IMPORTANT:
// Python Face Service uses this route.
// DO NOT MAKE THIS ADMIN ONLY.
// ======================================================

router.get("/", async (req, res) => {

    try {

        const employees =
            await Employee
                .find()
                .lean();

        return res.status(200).json(
            employees
        );

    } catch (error) {

        console.error(
            "Fetch employees error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch employees"
        });
    }
});

// ======================================================
// GET LOGGED-IN EMPLOYEE PROFILE
// ======================================================

router.get(
    "/employee/me",
    verifyToken,
    allowRoles("employee"),
    async (req, res) => {

        try {

            const employee =
                await Employee
                    .findById(req.user.id)
                    .lean();

            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }

            if (employee.isActive === false) {

                return res.status(403).json({
                    code:
                        "EMPLOYEE_DEACTIVATED",

                    message:
                        "Your account has been deactivated by Admin."
                });
            }

            return res.status(200).json({

                employee: {

                    id:
                        employee._id,

                    employeeId:
                        employee.employeeId,

                    name:
                        employee.name,

                    email:
                        employee.email,

                    department:
                        employee.department,

                    profileImage:
                        employee.profileImage || "",

                    isActive:
                        employee.isActive,

                    faceRegistered:
                        Array.isArray(
                            employee.faceEncodings
                        ) &&
                        employee.faceEncodings.length > 0
                }
            });

        } catch (error) {

            console.error(
                "Get employee profile error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch employee profile"
            });
        }
    }
);

// ======================================================
// GET SINGLE EMPLOYEE
// ======================================================

router.get("/:id", async (req, res) => {

    try {

        const employee =
            await Employee
                .findById(req.params.id)
                .lean();

        if (!employee) {

            return res.status(404).json({
                message:
                    "Employee not found"
            });
        }

        return res.status(200).json(
            employee
        );

    } catch (error) {

        console.error(
            "Fetch single employee error:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to fetch employee"
        });
    }
});

// ======================================================
// FACE SERVICE UPDATE
//
// Python Face Service uses:
// PUT /employees/:id
//
// DO NOT PROTECT THIS ROUTE.
// ======================================================

router.put("/:id", async (req, res) => {

    try {

        // Never allow these fields
        delete req.body.password;
        delete req.body.role;
        delete req.body.mustChangePassword;
        delete req.body.isActive;

        const allowedFields = [
            "employeeId",
            "name",
            "email",
            "department",
            "profileImage",
            "faceEncodings"
        ];

        const updateData = {};

        allowedFields.forEach((field) => {

            if (
                Object.prototype.hasOwnProperty.call(
                    req.body,
                    field
                )
            ) {

                updateData[field] =
                    req.body[field];
            }
        });

        if (updateData.employeeId) {

            updateData.employeeId =
                updateData.employeeId
                    .trim()
                    .toUpperCase();
        }

        if (updateData.name) {

            updateData.name =
                updateData.name.trim();
        }

        if (updateData.email) {

            updateData.email =
                updateData.email
                    .trim()
                    .toLowerCase();
        }

        if (updateData.department) {

            updateData.department =
                updateData.department.trim();
        }

        const employee =
            await Employee.findByIdAndUpdate(
                req.params.id,
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!employee) {

            return res.status(404).json({
                message:
                    "Employee not found"
            });
        }

        return res.status(200).json({
            message:
                "Employee updated successfully",

            employee
        });

    } catch (error) {

        console.error(
            "Face service employee update error:",
            error
        );

        if (error.code === 11000) {

            return res.status(409).json({
                message:
                    "Employee ID already exists"
            });
        }

        return res.status(500).json({
            message:
                "Failed to update employee"
        });
    }
});

// ======================================================
// ADMIN UPDATE EMPLOYEE
// ======================================================

router.put(
    "/admin/:id",
    ...adminOnly,
    upload.single("profileImage"),
    async (req, res) => {

        try {

            const {
                employeeId,
                name,
                email,
                department
            } = req.body;

            if (
                !employeeId?.trim() ||
                !name?.trim() ||
                !email?.trim() ||
                !department?.trim()
            ) {

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(400).json({
                    message:
                        "All employee details are required"
                });
            }

            const normalizedEmployeeId =
                employeeId.trim().toUpperCase();

            const normalizedEmail =
                email.trim().toLowerCase();

            // ==================================================
            // CHECK CURRENT EMPLOYEE
            // ==================================================

            const currentEmployee =
                await Employee.findById(
                    req.params.id
                );

            if (!currentEmployee) {

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }

            // ==================================================
            // DUPLICATE CHECK
            // ==================================================

            const duplicate =
                await Employee.findOne({

                    $or: [
                        {
                            employeeId:
                                normalizedEmployeeId
                        },
                        {
                            email:
                                normalizedEmail
                        }
                    ],

                    _id: {
                        $ne: req.params.id
                    }
                });

            if (duplicate) {

                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(409).json({
                    message:
                        "Another employee already has this Employee ID or email"
                });
            }

            // ==================================================
            // IMAGE
            // ==================================================

            let profileImage =
                currentEmployee.profileImage;

            const oldProfileImage =
                currentEmployee.profileImage;

            if (req.file) {

                profileImage =
                    `/uploads/employees/${req.file.filename}`;
            }

            // ==================================================
            // UPDATE
            // ==================================================

            currentEmployee.employeeId =
                normalizedEmployeeId;

            currentEmployee.name =
                name.trim();

            currentEmployee.email =
                normalizedEmail;

            currentEmployee.department =
                department.trim();

            currentEmployee.profileImage =
                profileImage;

            await currentEmployee.save();

            // ==================================================
            // DELETE OLD IMAGE
            // ==================================================

            if (
                req.file &&
                oldProfileImage &&
                oldProfileImage !== profileImage
            ) {

                deleteImageFile(
                    oldProfileImage
                );
            }

            return res.status(200).json({

                message:
                    "Employee details updated successfully",

                employee: {

                    id:
                        currentEmployee._id,

                    employeeId:
                        currentEmployee.employeeId,

                    name:
                        currentEmployee.name,

                    email:
                        currentEmployee.email,

                    department:
                        currentEmployee.department,

                    profileImage:
                        currentEmployee.profileImage,

                    isActive:
                        currentEmployee.isActive,

                    faceRegistered:
                        currentEmployee.faceEncodings?.length > 0
                }
            });

        } catch (error) {

            console.error(
                "Admin update employee error:",
                error
            );

            if (req.file) {

                try {

                    if (fs.existsSync(req.file.path)) {
                        fs.unlinkSync(req.file.path);
                    }

                } catch (fileError) {
                    console.error(
                        "File cleanup error:",
                        fileError.message
                    );
                }
            }

            if (error.code === 11000) {

                return res.status(409).json({
                    message:
                        "Employee ID already exists"
                });
            }

            return res.status(500).json({
                message:
                    "Failed to update employee"
            });
        }
    }
);

// ======================================================
// ACTIVATE / DEACTIVATE
// ======================================================

router.patch(
    "/admin/:id/status",
    ...adminOnly,
    async (req, res) => {

        try {

            const {
                isActive
            } = req.body;

            if (
                typeof isActive !== "boolean"
            ) {

                return res.status(400).json({
                    message:
                        "isActive must be true or false"
                });
            }

            const employee =
                await Employee.findByIdAndUpdate(
                    req.params.id,
                    {
                        isActive
                    },
                    {
                        new: true
                    }
                );

            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }

            return res.status(200).json({

                message:
                    isActive
                        ? "Employee activated successfully"
                        : "Employee deactivated successfully",

                employee: {

                    id:
                        employee._id,

                    employeeId:
                        employee.employeeId,

                    name:
                        employee.name,

                    isActive:
                        employee.isActive
                }
            });

        } catch (error) {

            console.error(
                "Employee status error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to update employee status"
            });
        }
    }
);

// ======================================================
// DELETE EMPLOYEE
//
// Attendance records are preserved.
// ======================================================

router.delete(
    "/admin/:id",
    ...adminOnly,
    async (req, res) => {

        try {

            const employee =
                await Employee.findById(
                    req.params.id
                );

            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }

            const oldProfileImage =
                employee.profileImage;

            await Employee.findByIdAndDelete(
                req.params.id
            );

            if (oldProfileImage) {
                deleteImageFile(
                    oldProfileImage
                );
            }

            return res.status(200).json({

                message:
                    "Employee deleted successfully",

                employee: {

                    id:
                        employee._id,

                    employeeId:
                        employee.employeeId,

                    name:
                        employee.name
                }
            });

        } catch (error) {

            console.error(
                "Delete employee error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to delete employee"
            });
        }
    }
);

// ======================================================
// REMOVE FACE DATA
// ======================================================

router.delete(
    "/admin/:id/face",
    ...adminOnly,
    async (req, res) => {

        try {

            const employee =
                await Employee.findByIdAndUpdate(
                    req.params.id,
                    {
                        faceEncodings: []
                    },
                    {
                        new: true
                    }
                );

            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }

            return res.status(200).json({
                message:
                    "Employee face data removed successfully"
            });

        } catch (error) {

            console.error(
                "Remove face error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to remove employee face data"
            });
        }
    }
);

// ======================================================
// RESET PASSWORD
// ======================================================

router.post(
    "/admin/:id/reset-password",
    ...adminOnly,
    async (req, res) => {

        try {

            const employee =
                await Employee.findById(
                    req.params.id
                );

            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }

            const temporaryPassword =
                crypto
                    .randomBytes(12)
                    .toString("base64url");

            const hashedPassword =
                await bcrypt.hash(
                    temporaryPassword,
                    12
                );

            employee.password =
                hashedPassword;

            employee.mustChangePassword =
                true;

            await employee.save();

            return res.status(200).json({

                message:
                    "Employee password reset successfully",

                employee: {

                    id:
                        employee._id,

                    employeeId:
                        employee.employeeId,

                    name:
                        employee.name
                },

                temporaryPassword
            });

        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to reset employee password"
            });
        }
    }
);

// ======================================================
// EMPLOYEE UPDATE PROFILE IMAGE
// ======================================================

router.put(
    "/employee/profile-image",
    verifyToken,
    allowRoles("employee"),
    employeeImageUpload.single("profileImage"),

    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    message:
                        "Please select a profile image."
                });
            }

            const employee =
                await Employee.findById(
                    req.user.id
                );

            if (!employee) {

                if (
                    req.file.path &&
                    fs.existsSync(req.file.path)
                ) {
                    fs.unlinkSync(
                        req.file.path
                    );
                }

                return res.status(404).json({
                    message:
                        "Employee not found."
                });
            }

            if (!employee.isActive) {

                if (
                    req.file.path &&
                    fs.existsSync(req.file.path)
                ) {
                    fs.unlinkSync(
                        req.file.path
                    );
                }

                return res.status(403).json({
                    code:
                        "EMPLOYEE_DEACTIVATED",

                    message:
                        "Your account has been deactivated by Admin."
                });
            }

            // ==================================================
            // OLD IMAGE
            // ==================================================

            const oldProfileImage =
                employee.profileImage;

            // ==================================================
            // NEW IMAGE PATH
            // ==================================================

            const newProfileImage =
                `/uploads/employees/${req.file.filename}`;

            employee.profileImage =
                newProfileImage;

            await employee.save();

            // ==================================================
            // DELETE OLD IMAGE
            // ==================================================

            if (
                oldProfileImage &&
                oldProfileImage.startsWith(
                    "/uploads/employees/"
                )
            ) {

                const oldImagePath =
                    path.join(
                        __dirname,
                        "..",
                        oldProfileImage.replace(
                            /^\/+/,
                            ""
                        )
                    );

                if (
                    fs.existsSync(
                        oldImagePath
                    ) &&
                    oldImagePath !==
                    req.file.path
                ) {

                    fs.unlinkSync(
                        oldImagePath
                    );
                }
            }

            return res.status(200).json({

                message:
                    "Profile image updated successfully.",

                employee: {

                    id:
                        employee._id,

                    employeeId:
                        employee.employeeId,

                    name:
                        employee.name,

                    email:
                        employee.email,

                    department:
                        employee.department,

                    profileImage:
                        employee.profileImage,

                    isActive:
                        employee.isActive
                }
            });

        } catch (error) {

            console.error(
                "Employee profile image error:",
                error
            );

            if (
                req.file &&
                req.file.path &&
                fs.existsSync(
                    req.file.path
                )
            ) {

                fs.unlinkSync(
                    req.file.path
                );
            }

            return res.status(500).json({
                message:
                    error.message ||
                    "Profile image upload failed."
            });
        }
    }
);

// ======================================================
// MULTER ERROR HANDLER
// ======================================================

router.use(
    (error, req, res, next) => {

        if (
            error instanceof multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({
                    message:
                        "Profile image must be less than 5 MB"
                });
            }

            return res.status(400).json({
                message:
                    error.message
            });
        }

        if (error) {

            console.error(
                "Employee route error:",
                error
            );

            return res.status(400).json({
                message:
                    error.message ||
                    "Employee operation failed"
            });
        }

        next();
    }
);

module.exports = router;