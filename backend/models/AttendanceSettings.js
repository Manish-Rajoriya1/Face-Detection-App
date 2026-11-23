const mongoose = require("mongoose");

const attendanceSettingsSchema = new mongoose.Schema(
    {
        officeStartTime: {
            type: String,
            default: "09:30"
        },

        officeEndTime: {
            type: String,
            default: "18:00"
        },

        lateAfterMinutes: {
            type: Number,
            default: 15
        },

        halfDayAfterTime: {
            type: String,
            default: "11:00"
        },

        minimumFullDayHours: {
            type: Number,
            default: 7
        },

        minimumHalfDayHours: {
            type: Number,
            default: 4
        },

        lunchEnabled: {
            type: Boolean,
            default: true
        },

        lunchStartTime: {
            type: String,
            default: "13:00"
        },

        lunchEndTime: {
            type: String,
            default: "14:00"
        },

        lunchMode: {
            type: String,
            enum: ["automatic", "employee"],
            default: "employee"
        },

        workingDays: {
            type: [Number],
            default: [1, 2, 3, 4, 5, 6]
        },

        attendanceFinalizeTime: {
            type: String,
            default: "23:00"
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "AttendanceSettings",
        attendanceSettingsSchema
    );