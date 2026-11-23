const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipientRole: {
            type: String,
            enum: ["admin", "employee"],
            required: true
        },

        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        type: {
            type: String,
            enum: [
                "leave_request",
                "leave_approved",
                "leave_rejected",

                // Announcement types
                "announcement",
                "holiday",
                "important",

                "general"
            ],
            default: "general"
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        // =====================================================
        // HOLIDAY DATE RANGE
        // =====================================================

        holidayFrom: {
            type: String,
            default: null
        },

        holidayTo: {
            type: String,
            default: null
        },

        relatedLeaveRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LeaveRequest",
            default: null
        },

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);