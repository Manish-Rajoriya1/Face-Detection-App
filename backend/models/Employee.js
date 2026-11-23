const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            trim: true,
            default: ""
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },

        // ==========================================
        // EMPLOYEE PROFILE IMAGE
        // ==========================================
        profileImage: {
            type: String,
            default: ""
        },

        // ==========================================
        // MULTIPLE FACE EMBEDDINGS
        // Face Service uses this field
        // ==========================================
        faceEncodings: {
            type: [[Number]],
            default: []
        },

        // ==========================================
        // EMPLOYEE LOGIN CREDENTIALS
        // ==========================================
        password: {
            type: String,
            select: false
        },

        mustChangePassword: {
            type: Boolean,
            default: true
        },

        // ==========================================
        // EMPLOYEE ACCOUNT STATUS
        // ==========================================
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Employee", employeeSchema);