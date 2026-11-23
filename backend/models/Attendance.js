const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        employeeId: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            index: true
        },

        date: {
            type: String,
            required: true,
            index: true
        },

        checkIn: {
            type: Date,
            default: null
        },

        checkOut: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["Present", "Absent", "Late", "Half Day"],
            default: "Present"
        },

        workingHours: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Ek employee ki ek date par sirf ek attendance
attendanceSchema.index(
    { employeeId: 1, date: 1 },
    { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);