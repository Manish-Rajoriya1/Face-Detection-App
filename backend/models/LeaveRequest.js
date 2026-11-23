const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        employeeId: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        employeeName: {
            type: String,
            required: true,
            trim: true
        },

        leaveType: {
            type: String,
            enum: [
                "Casual Leave",
                "Sick Leave",
                "Emergency Leave",
                "Other"
            ],
            required: true
        },

        fromDate: {
            type: String,
            required: true
        },

        toDate: {
            type: String,
            required: true
        },

        reason: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            default: "",
            trim: true
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
                "cancelled"
            ],
            default: "pending"
        },

        adminReason: {
            type: String,
            default: "",
            trim: true
        },

        reviewedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// =====================================================
// AUTOMATIC DELETE AFTER 45 DAYS
// =====================================================

leaveRequestSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 30 * 24 * 60 * 60
    }
);


module.exports = mongoose.model(
    "LeaveRequest",
    leaveRequestSchema
);