const express = require("express");

const Notification = require("../models/Notification");
const Employee = require("../models/Employee");

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET NOTIFICATIONS
// =====================================================

router.get(
    "/",
    verifyToken,
    async (req, res) => {

        try {

            const query = {
                recipientRole:
                    req.user.role
            };


            // Employee notifications
            if (
                req.user.role ===
                "employee"
            ) {

                query.recipientId =
                    req.user.id;

            }


            const notifications =
                await Notification.find(query)
                    .sort({
                        createdAt: -1
                    })
                    .limit(50);


            const unreadCount =
                await Notification.countDocuments({
                    ...query,
                    isRead: false
                });


            return res.json({

                notifications,

                unreadCount

            });


        } catch (error) {

            console.error(
                "Get notifications error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load notifications."
            });

        }

    }
);


// =====================================================
// ADMIN
// CREATE ANNOUNCEMENT
// =====================================================

router.post(
    "/announcement",
    verifyToken,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const {
                title,
                message,
                type,
                recipientType,
                employeeId,

                // Holiday dates
                holidayFrom,
                holidayTo

            } = req.body;


            // -------------------------------------------------
            // VALIDATION
            // -------------------------------------------------

            if (
                !title ||
                !title.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Announcement title is required."
                });

            }


            if (
                !message ||
                !message.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Announcement message is required."
                });

            }


            const allowedTypes = [
                "announcement",
                "holiday",
                "important"
            ];


            if (
                !allowedTypes.includes(type)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid announcement type."
                });

            }


            if (
                ![
                    "all",
                    "employee"
                ].includes(recipientType)
            ) {

                return res.status(400).json({
                    message:
                        "Invalid recipient type."
                });

            }


            // -------------------------------------------------
            // HOLIDAY DATE VALIDATION
            // -------------------------------------------------

            if (
                type === "holiday" &&
                !holidayFrom
            ) {

                return res.status(400).json({
                    message:
                        "Holiday start date is required."
                });

            }


            if (
                type === "holiday" &&
                !holidayTo
            ) {

                return res.status(400).json({
                    message:
                        "Holiday end date is required."
                });

            }


            if (
                type === "holiday" &&
                holidayFrom &&
                holidayTo &&
                holidayFrom > holidayTo
            ) {

                return res.status(400).json({
                    message:
                        "Holiday end date cannot be before start date."
                });

            }


            // -------------------------------------------------
            // NON-HOLIDAY
            // DATES SHOULD BE NULL
            // -------------------------------------------------

            const finalHolidayFrom =
                type === "holiday"
                    ? holidayFrom
                    : null;

            const finalHolidayTo =
                type === "holiday"
                    ? holidayTo
                    : null;


            // =================================================
            // SEND TO ALL EMPLOYEES
            // =================================================

            if (
                recipientType ===
                "all"
            ) {

                const employees =
                    await Employee.find({
                        isActive: true
                    }).select("_id");


                if (
                    employees.length === 0
                ) {

                    return res.status(404).json({
                        message:
                            "No active employees found."
                    });

                }


                const notifications =
                    employees.map(
                        (employee) => ({

                            recipientRole:
                                "employee",

                            recipientId:
                                employee._id,

                            type,

                            title:
                                title.trim(),

                            message:
                                message.trim(),

                            // Holiday dates
                            holidayFrom:
                                finalHolidayFrom,

                            holidayTo:
                                finalHolidayTo,

                            isRead: false

                        })
                    );


                await Notification.insertMany(
                    notifications
                );


                return res.status(201).json({

                    message:
                        "Announcement sent to all active employees.",

                    count:
                        notifications.length

                });

            }


            // =================================================
            // SEND TO SPECIFIC EMPLOYEE
            // =================================================

            if (
                !employeeId
            ) {

                return res.status(400).json({
                    message:
                        "Please select an employee."
                });

            }


            const employee =
                await Employee.findById(
                    employeeId
                ).select(
                    "_id name employeeId isActive"
                );


            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found."
                });

            }


            if (
                employee.isActive ===
                false
            ) {

                return res.status(400).json({
                    message:
                        "This employee account is deactivated."
                });

            }


            const notification =
                await Notification.create({

                    recipientRole:
                        "employee",

                    recipientId:
                        employee._id,

                    type,

                    title:
                        title.trim(),

                    message:
                        message.trim(),

                    // Holiday dates
                    holidayFrom:
                        finalHolidayFrom,

                    holidayTo:
                        finalHolidayTo,

                    isRead: false

                });


            return res.status(201).json({

                message:
                    "Announcement sent successfully.",

                notification

            });


        } catch (error) {

            console.error(
                "Create announcement error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to create announcement."
            });

        }

    }
);


// =====================================================
// ADMIN
// GET ACTIVE EMPLOYEES FOR ANNOUNCEMENT
// =====================================================

router.get(
    "/announcement/employees",
    verifyToken,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const employees =
                await Employee.find({
                    isActive: true
                })
                    .select(
                        "_id name employeeId department profileImage"
                    )
                    .sort({
                        name: 1
                    });


            return res.json({
                employees
            });


        } catch (error) {

            console.error(
                "Get announcement employees error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load employees."
            });

        }

    }
);


// =====================================================
// MARK ONE AS READ
// =====================================================

router.patch(
    "/:id/read",
    verifyToken,
    async (req, res) => {

        try {

            const query = {
                _id: req.params.id,
                recipientRole:
                    req.user.role
            };


            if (
                req.user.role ===
                "employee"
            ) {

                query.recipientId =
                    req.user.id;

            }


            const notification =
                await Notification.findOneAndUpdate(
                    query,
                    {
                        isRead: true
                    },
                    {
                        new: true
                    }
                );


            if (!notification) {

                return res.status(404).json({
                    message:
                        "Notification not found."
                });

            }


            return res.json({
                notification
            });


        } catch (error) {

            console.error(
                "Mark notification read error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to update notification."
            });

        }

    }
);


// =====================================================
// MARK ALL AS READ
// =====================================================

router.patch(
    "/read-all",
    verifyToken,
    async (req, res) => {

        try {

            const query = {
                recipientRole:
                    req.user.role,

                isRead: false
            };


            if (
                req.user.role ===
                "employee"
            ) {

                query.recipientId =
                    req.user.id;

            }


            await Notification.updateMany(
                query,
                {
                    isRead: true
                }
            );


            return res.json({
                message:
                    "All notifications marked as read."
            });


        } catch (error) {

            console.error(
                "Mark all notifications error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to update notifications."
            });

        }

    }
);


module.exports = router;