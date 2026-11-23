const express = require("express");

const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const Employee = require("../models/Employee");

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// AUTH
// =====================================================

const employeeOnly = [
    verifyToken,
    allowRoles("employee")
];

const adminOnly = [
    verifyToken,
    allowRoles("admin")
];


// =====================================================
// HELPER
// =====================================================

const isValidDateRange = (
    fromDate,
    toDate
) => {
    if (!fromDate || !toDate) {
        return false;
    }

    return fromDate <= toDate;
};


// =====================================================
// EMPLOYEE
// CREATE LEAVE REQUEST
// =====================================================

router.post(
    "/",
    ...employeeOnly,
    async (req, res) => {

        try {

            const {
                leaveType,
                fromDate,
                toDate,
                reason,
                message
            } = req.body;


            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (
                !leaveType ||
                !fromDate ||
                !toDate ||
                !reason?.trim()
            ) {

                return res.status(400).json({
                    message:
                        "Leave type, dates and reason are required."
                });

            }


            if (
                !isValidDateRange(
                    fromDate,
                    toDate
                )
            ) {

                return res.status(400).json({
                    message:
                        "From date cannot be after To date."
                });

            }


            // -----------------------------------------
            // GET EMPLOYEE
            // -----------------------------------------

            const employee =
                await Employee.findById(
                    req.user.id
                );


            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found."
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


            // -----------------------------------------
            // CHECK DUPLICATE PENDING REQUEST
            // -----------------------------------------

            const existingRequest =
                await LeaveRequest.findOne({
                    employee:
                        employee._id,

                    status: "pending",

                    fromDate: {
                        $lte: toDate
                    },

                    toDate: {
                        $gte: fromDate
                    }
                });


            if (existingRequest) {

                return res.status(400).json({
                    message:
                        "You already have a pending leave request for these dates."
                });

            }


            // -----------------------------------------
            // CREATE REQUEST
            // -----------------------------------------

            const leaveRequest =
                await LeaveRequest.create({

                    employee:
                        employee._id,

                    employeeId:
                        employee.employeeId,

                    employeeName:
                        employee.name,

                    leaveType,

                    fromDate,

                    toDate,

                    reason:
                        reason.trim(),

                    message:
                        message?.trim() || ""

                });


            // -----------------------------------------
            // ADMIN NOTIFICATION
            // -----------------------------------------

            await Notification.create({

                recipientRole:
                    "admin",

                type:
                    "leave_request",

                title:
                    "New Leave Request",

                message:
                    `${employee.name} (${employee.employeeId}) has submitted a ${leaveType} request from ${fromDate} to ${toDate}.`,

                relatedLeaveRequest:
                    leaveRequest._id

            });


            return res.status(201).json({

                message:
                    "Leave request submitted successfully.",

                leaveRequest

            });


        } catch (error) {

            console.error(
                "Create leave request error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to submit leave request."
            });

        }

    }
);


// =====================================================
// EMPLOYEE
// GET MY LEAVE REQUESTS
// =====================================================

router.get(
    "/my",
    ...employeeOnly,
    async (req, res) => {

        try {

            const requests =
                await LeaveRequest.find({
                    employee:
                        req.user.id
                })
                    .sort({
                        createdAt: -1
                    });


            return res.json({
                requests
            });


        } catch (error) {

            console.error(
                "Get employee leaves error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load leave requests."
            });

        }

    }
);


// =====================================================
// EMPLOYEE
// CANCEL PENDING REQUEST
// =====================================================

router.patch(
    "/:id/cancel",
    ...employeeOnly,
    async (req, res) => {

        try {

            const leaveRequest =
                await LeaveRequest.findOne({
                    _id: req.params.id,
                    employee: req.user.id,
                    status: "pending"
                });


            if (!leaveRequest) {

                return res.status(404).json({
                    message:
                        "Pending leave request not found."
                });

            }


            leaveRequest.status =
                "cancelled";

            await leaveRequest.save();


            return res.json({
                message:
                    "Leave request cancelled successfully."
            });


        } catch (error) {

            console.error(
                "Cancel leave error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to cancel leave request."
            });

        }

    }
);


// =====================================================
// ADMIN
// GET ALL LEAVE REQUESTS
// =====================================================

router.get(
    "/admin",
    ...adminOnly,
    async (req, res) => {

        try {

            const requests =
                await LeaveRequest.find()
                    .populate(
                        "employee",
                        "_id profileImage name employeeId department email isActive"
                    )
                    .sort({
                        createdAt: -1
                    });


            return res.json({
                requests
            });


        } catch (error) {

            console.error(
                "Admin leave list error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load leave requests."
            });

        }

    }
);


// =====================================================
// ADMIN
// GET PENDING LEAVE REQUESTS
// =====================================================

router.get(
    "/admin/pending",
    ...adminOnly,
    async (req, res) => {

        try {

            const requests =
                await LeaveRequest.find({
                    status: "pending"
                })
                    .sort({
                        createdAt: -1
                    });


            return res.json({
                requests
            });


        } catch (error) {

            console.error(
                "Pending leave error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load pending requests."
            });

        }

    }
);


// =====================================================
// ADMIN
// APPROVE LEAVE
// =====================================================

router.patch(
    "/admin/:id/approve",
    ...adminOnly,
    async (req, res) => {

        try {

            const leaveRequest =
                await LeaveRequest.findById(
                    req.params.id
                );


            if (!leaveRequest) {

                return res.status(404).json({
                    message:
                        "Leave request not found."
                });

            }


            if (
                leaveRequest.status !==
                "pending"
            ) {

                return res.status(400).json({
                    message:
                        "This leave request has already been processed."
                });

            }


            leaveRequest.status =
                "approved";

            leaveRequest.reviewedAt =
                new Date();

            leaveRequest.adminReason =
                req.body?.adminReason?.trim() || "";
            await leaveRequest.save();


            // -----------------------------------------
            // EMPLOYEE NOTIFICATION
            // -----------------------------------------

            await Notification.create({

                recipientRole:
                    "employee",

                recipientId:
                    leaveRequest.employee,

                type:
                    "leave_approved",

                title:
                    "Leave Request Approved",

                message:
                    `Your ${leaveRequest.leaveType} from ${leaveRequest.fromDate} to ${leaveRequest.toDate} has been approved by Admin.`,

                relatedLeaveRequest:
                    leaveRequest._id

            });


            return res.json({

                message:
                    "Leave request approved successfully.",

                leaveRequest

            });


        } catch (error) {

            console.error(
                "Approve leave error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to approve leave request."
            });

        }

    }
);


// =====================================================
// ADMIN
// REJECT LEAVE
// =====================================================

router.patch(
    "/admin/:id/reject",
    ...adminOnly,
    async (req, res) => {

        try {

            const leaveRequest =
                await LeaveRequest.findById(
                    req.params.id
                );


            if (!leaveRequest) {

                return res.status(404).json({
                    message:
                        "Leave request not found."
                });

            }


            if (
                leaveRequest.status !==
                "pending"
            ) {

                return res.status(400).json({
                    message:
                        "This leave request has already been processed."
                });

            }


            const adminReason =
                req.body.adminReason?.trim() || "";


            leaveRequest.status =
                "rejected";

            leaveRequest.adminReason =
                adminReason;

            leaveRequest.reviewedAt =
                new Date();


            await leaveRequest.save();


            // -----------------------------------------
            // EMPLOYEE NOTIFICATION
            // -----------------------------------------

            await Notification.create({

                recipientRole:
                    "employee",

                recipientId:
                    leaveRequest.employee,

                type:
                    "leave_rejected",

                title:
                    "Leave Request Rejected",

                message:
                    `Your ${leaveRequest.leaveType} from ${leaveRequest.fromDate} to ${leaveRequest.toDate} has been rejected by Admin.`,

                relatedLeaveRequest:
                    leaveRequest._id

            });


            return res.json({

                message:
                    "Leave request rejected successfully.",

                leaveRequest

            });


        } catch (error) {

            console.error(
                "Reject leave error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to reject leave request."
            });

        }

    }
);

// =====================================================
// ADMIN
// DELETE LEAVE REQUEST
// =====================================================

router.delete(
    "/admin/:id",
    ...adminOnly,
    async (req, res) => {

        try {

            const leaveRequest =
                await LeaveRequest.findById(
                    req.params.id
                );

            if (!leaveRequest) {

                return res.status(404).json({
                    message:
                        "Leave request not found."
                });

            }

            // Delete related notifications
            await Notification.deleteMany({
                relatedLeaveRequest:
                    leaveRequest._id
            });

            // Delete leave request
            await LeaveRequest.findByIdAndDelete(
                req.params.id
            );

            return res.json({

                message:
                    "Leave request deleted successfully."

            });

        } catch (error) {

            console.error(
                "Delete leave request error:",
                error
            );

            return res.status(500).json({

                message:
                    "Unable to delete leave request."

            });

        }

    }
);


// =====================================================
// ADMIN
// CURRENT / UPCOMING LEAVE OF EMPLOYEE
// =====================================================

router.get(
    "/admin/employee/:employeeId/current",
    ...adminOnly,
    async (req, res) => {

        try {

            const employee =
                await Employee.findById(
                    req.params.employeeId
                );


            if (!employee) {

                return res.status(404).json({
                    message:
                        "Employee not found."
                });

            }


            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];


            // -----------------------------------------
            // CURRENT LEAVE
            // -----------------------------------------

            const currentLeave =
                await LeaveRequest.findOne({

                    employee:
                        employee._id,

                    status:
                        "approved",

                    fromDate: {
                        $lte: today
                    },

                    toDate: {
                        $gte: today
                    }

                })
                    .sort({
                        fromDate: 1
                    });



            // -----------------------------------------
            // UPCOMING LEAVE
            // -----------------------------------------

            const upcomingLeave =
                await LeaveRequest.findOne({

                    employee:
                        employee._id,

                    status:
                        "approved",

                    fromDate: {
                        $gt: today
                    }

                })
                    .sort({
                        fromDate: 1
                    });


            return res.json({

                currentLeave:
                    currentLeave || null,

                upcomingLeave:
                    upcomingLeave || null

            });


        } catch (error) {

            console.error(
                "Employee leave status error:",
                error
            );

            return res.status(500).json({
                message:
                    "Unable to load employee leave status."
            });

        }

    }
);


module.exports = router;