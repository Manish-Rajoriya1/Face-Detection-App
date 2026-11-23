const express = require("express");

const AttendanceSettings =
    require("../models/AttendanceSettings");

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// GET ATTENDANCE SETTINGS
// ======================================================

router.get(
    "/employee",
    verifyToken,
    allowRoles("employee"),
    async (req, res) => {
        try {
            let settings =
                await AttendanceSettings.findOne();

            if (!settings) {
                settings =
                    await AttendanceSettings.create({});
            }

            return res.status(200).json({
                settings
            });

        } catch (error) {

            console.error(
                "Get employee attendance settings error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch attendance settings"
            });
        }
    }
);



router.get(
    "/",
    verifyToken,
    allowRoles("admin"),
    async (req, res) => {

        try {

            let settings =
                await AttendanceSettings.findOne();

            if (!settings) {

                settings =
                    await AttendanceSettings.create({});

            }

            return res.status(200).json({
                settings
            });

        } catch (error) {

            console.error(
                "Get attendance settings error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch attendance settings"
            });
        }
    }
);


// ======================================================
// UPDATE ATTENDANCE SETTINGS
// ======================================================

router.put(
    "/",
    verifyToken,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const allowedFields = [
                "officeStartTime",
                "officeEndTime",
                "lateAfterMinutes",
                "halfDayAfterTime",
                "minimumFullDayHours",
                "minimumHalfDayHours",
                "lunchEnabled",
                "lunchStartTime",
                "lunchEndTime",
                "lunchMode",
                "workingDays",
                "attendanceFinalizeTime",
                "isActive"
            ];


            const updateData = {};

            allowedFields.forEach((field) => {

                if (
                    req.body[field] !== undefined
                ) {
                    updateData[field] =
                        req.body[field];
                }

            });


            let settings =
                await AttendanceSettings.findOne();


            if (!settings) {

                settings =
                    await AttendanceSettings.create(
                        updateData
                    );

            } else {

                Object.assign(
                    settings,
                    updateData
                );

                await settings.save();

            }


            return res.status(200).json({
                message:
                    "Attendance settings updated successfully.",
                settings
            });

        } catch (error) {

            console.error(
                "Update attendance settings error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to update attendance settings"
            });
        }
    }
);


module.exports = router;