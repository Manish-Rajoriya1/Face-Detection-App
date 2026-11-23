const express = require("express");

const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const AttendanceSettings = require("../models/AttendanceSettings");

const {
    verifyToken,
    allowRoles
} = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// EMPLOYEE ONLY
// ==========================================

const employeeOnly = [
    verifyToken,
    allowRoles("employee")
];


// ==========================================
// ADMIN ONLY
// ==========================================

const adminOnly = [
    verifyToken,
    allowRoles("admin")
];


// ==========================================
// HELPER
// ==========================================

const getToday = () => {
    return new Date()
        .toISOString()
        .split("T")[0];
};


// ==========================================
// GET ATTENDANCE SETTINGS
// ==========================================

const getAttendanceSettings = async () => {

    let settings =
        await AttendanceSettings.findOne().lean();

    if (!settings) {
        settings =
            await AttendanceSettings.create({});

        settings = settings.toObject();
    }

    return settings;
};


// ==========================================
// TIME TO MINUTES
// ==========================================

const timeToMinutes = (time) => {

    if (!time) {
        return 0;
    }

    const [hours, minutes] =
        time.split(":").map(Number);

    return (
        (hours * 60) +
        minutes
    );
};


// ==========================================
// CALCULATE STATUS
// ==========================================

const calculateAttendanceStatus = (
    attendance,
    settings
) => {

    if (!attendance) {
        return "Absent";
    }

    if (!attendance.checkIn) {
        return "Absent";
    }

    const checkInDate =
        new Date(attendance.checkIn);

    const checkInMinutes =
        checkInDate.getHours() * 60 +
        checkInDate.getMinutes();

    const officeStartMinutes =
        timeToMinutes(
            settings.officeStartTime
        );

    const lateAfterMinutes =
        Number(
            settings.lateAfterMinutes || 0
        );

    const lateLimit =
        officeStartMinutes +
        lateAfterMinutes;

    const halfDayAfterMinutes =
        timeToMinutes(
            settings.halfDayAfterTime
        );


    // --------------------------------------
    // HALF DAY
    // --------------------------------------

    if (
        halfDayAfterMinutes > 0 &&
        checkInMinutes >=
        halfDayAfterMinutes
    ) {
        return "Half Day";
    }


    // --------------------------------------
    // LATE
    // --------------------------------------

    if (
        checkInMinutes >
        lateLimit
    ) {
        return "Late";
    }


    // --------------------------------------
    // EXISTING STATUS
    // --------------------------------------

    return attendance.status ||
        "Present";
};


// ==========================================
// CHECK IN
// ==========================================

router.post(
    "/check-in",
    ...employeeOnly,
    async (req, res) => {

        try {

            const employeeId =
                req.user.employeeId;

            if (!employeeId) {
                return res.status(400).json({
                    message:
                        "Employee ID not found in token"
                });
            }

            const employee =
                await Employee.findOne({
                    employeeId:
                        employeeId.toUpperCase()
                }).lean();

            if (!employee) {
                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }

            if (
                employee.isActive === false
            ) {
                return res.status(403).json({
                    code:
                        "EMPLOYEE_DEACTIVATED",
                    message:
                        "Your account has been deactivated by Admin."
                });
            }


            const today =
                getToday();


            const existingAttendance =
                await Attendance.findOne({
                    employeeId:
                        employeeId.toUpperCase(),
                    date: today
                });


            if (
                existingAttendance?.checkIn
            ) {
                return res.status(409).json({
                    message:
                        "You have already checked in today",
                    attendance:
                        existingAttendance
                });
            }


            const now =
                new Date();


            let attendance;


            if (existingAttendance) {

                existingAttendance.checkIn =
                    now;

                existingAttendance.status =
                    "Present";

                attendance =
                    await existingAttendance.save();

            } else {

                attendance =
                    await Attendance.create({
                        employeeId:
                            employeeId.toUpperCase(),

                        date: today,

                        checkIn: now,

                        status: "Present",

                        workingHours: 0
                    });
            }


            res.status(201).json({
                message:
                    "Check-in successful",

                attendance
            });

        } catch (error) {

            console.error(
                "Check-in error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to check in"
            });
        }
    }
);


// ==========================================
// CHECK OUT
// ==========================================

router.post(
    "/check-out",
    ...employeeOnly,
    async (req, res) => {

        try {

            const employeeId =
                req.user.employeeId;

            if (!employeeId) {
                return res.status(400).json({
                    message:
                        "Employee ID not found in token"
                });
            }


            const today =
                getToday();


            const attendance =
                await Attendance.findOne({
                    employeeId:
                        employeeId.toUpperCase(),

                    date: today
                });


            if (!attendance) {
                return res.status(404).json({
                    message:
                        "Today's check-in record not found"
                });
            }


            if (!attendance.checkIn) {
                return res.status(400).json({
                    message:
                        "You have not checked in today"
                });
            }


            if (attendance.checkOut) {
                return res.status(409).json({
                    message:
                        "You have already checked out today",

                    attendance
                });
            }


            const now =
                new Date();


            attendance.checkOut =
                now;


            const difference =
                now.getTime() -
                attendance.checkIn.getTime();


            const workingHours =
                difference /
                (1000 * 60 * 60);


            attendance.workingHours =
                Number(
                    workingHours.toFixed(2)
                );


            // ----------------------------------
            // APPLY ATTENDANCE SETTINGS
            // ----------------------------------

            const settings =
                await getAttendanceSettings();


            const calculatedStatus =
                calculateAttendanceStatus(
                    attendance,
                    settings
                );


            // Working hour based half day
            if (
                settings.minimumHalfDayHours &&
                attendance.workingHours <
                Number(
                    settings.minimumFullDayHours
                ) &&
                attendance.workingHours >=
                Number(
                    settings.minimumHalfDayHours
                )
            ) {
                if (
                    calculatedStatus !==
                    "Late"
                ) {
                    attendance.status =
                        "Half Day";
                }
            }


            if (
                attendance.workingHours <
                Number(
                    settings.minimumHalfDayHours
                )
            ) {
                attendance.status =
                    "Half Day";
            } else {
                attendance.status =
                    calculatedStatus;
            }


            await attendance.save();


            res.status(200).json({
                message:
                    "Check-out successful",

                attendance
            });

        } catch (error) {

            console.error(
                "Check-out error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to check out"
            });
        }
    }
);


// ==========================================
// MY TODAY'S ATTENDANCE
// ==========================================

router.get(
    "/my",
    ...employeeOnly,
    async (req, res) => {

        try {

            const employeeId =
                req.user.employeeId;

            const today =
                getToday();


            const attendance =
                await Attendance.findOne({
                    employeeId:
                        employeeId.toUpperCase(),

                    date: today
                }).lean();


            res.status(200).json({
                date: today,

                attendance:
                    attendance || null
            });

        } catch (error) {

            console.error(
                "Fetch today's attendance error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch attendance"
            });
        }
    }
);


// ==========================================
// ATTENDANCE HISTORY
// ==========================================

router.get(
    "/history",
    ...employeeOnly,
    async (req, res) => {

        try {

            const employeeId =
                req.user.employeeId;


            const attendance =
                await Attendance.find({
                    employeeId:
                        employeeId.toUpperCase()
                })
                    .sort({
                        date: -1
                    })
                    .lean();


            res.status(200).json({
                attendance
            });

        } catch (error) {

            console.error(
                "Attendance history error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch attendance history"
            });
        }
    }
);


// ==========================================
// MONTHLY SUMMARY
// ==========================================

router.get(
    "/monthly-summary",
    ...employeeOnly,
    async (req, res) => {

        try {

            const employeeId =
                req.user.employeeId;


            const year =
                Number(req.query.year) ||
                new Date().getFullYear();


            const month =
                Number(req.query.month) ||
                new Date().getMonth() + 1;


            const monthString =
                String(month).padStart(2, "0");


            const startDate =
                `${year}-${monthString}-01`;


            const nextMonth =
                month === 12
                    ? 1
                    : month + 1;


            const nextYear =
                month === 12
                    ? year + 1
                    : year;


            const nextMonthString =
                String(nextMonth).padStart(2, "0");


            const endDate =
                `${nextYear}-${nextMonthString}-01`;


            const attendance =
                await Attendance.find({
                    employeeId:
                        employeeId.toUpperCase(),

                    date: {
                        $gte: startDate,
                        $lt: endDate
                    }
                })
                    .sort({
                        date: 1
                    })
                    .lean();


            const totalDays =
                attendance.length;


            const presentDays =
                attendance.filter(
                    item =>
                        item.status ===
                        "Present"
                ).length;


            const lateDays =
                attendance.filter(
                    item =>
                        item.status ===
                        "Late"
                ).length;


            const halfDays =
                attendance.filter(
                    item =>
                        item.status ===
                        "Half Day"
                ).length;


            const totalWorkingHours =
                attendance.reduce(
                    (total, item) =>
                        total +
                        (item.workingHours || 0),

                    0
                );


            res.status(200).json({

                year,

                month,

                summary: {

                    totalDays,

                    presentDays,

                    lateDays,

                    halfDays,

                    totalWorkingHours:
                        Number(
                            totalWorkingHours.toFixed(2)
                        )
                },

                attendance
            });

        } catch (error) {

            console.error(
                "Monthly summary error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch monthly summary"
            });
        }
    }
);


// ==================================================
// ADMIN - TODAY / DAILY ATTENDANCE
// ==================================================

router.get(
    "/admin/today",
    ...adminOnly,
    async (req, res) => {

        try {

            const date =
                req.query.date ||
                getToday();


            const search =
                String(
                    req.query.search || ""
                ).trim();


            const statusFilter =
                String(
                    req.query.status || ""
                ).trim();


            const department =
                String(
                    req.query.department || ""
                ).trim();


            const settings =
                await getAttendanceSettings();


            // --------------------------------------
            // GET ACTIVE EMPLOYEES
            // --------------------------------------

            const employeeQuery = {
                isActive: true
            };


            if (department) {
                employeeQuery.department =
                    department;
            }


            if (search) {

                employeeQuery.$or = [
                    {
                        name: {
                            $regex:
                                search,
                            $options:
                                "i"
                        }
                    },
                    {
                        employeeId: {
                            $regex:
                                search.toUpperCase(),
                            $options:
                                "i"
                        }
                    }
                ];
            }


            const employees =
                await Employee.find(
                    employeeQuery
                )
                    .select(
                        "_id employeeId name email department profileImage isActive"
                    )
                    .sort({
                        name: 1
                    })
                    .lean();


            // --------------------------------------
            // GET ATTENDANCE
            // --------------------------------------

            const attendanceRecords =
                await Attendance.find({
                    date
                })
                    .lean();


            const attendanceMap =
                new Map();


            attendanceRecords.forEach(
                record => {

                    attendanceMap.set(
                        record.employeeId.toUpperCase(),
                        record
                    );
                }
            );


            // --------------------------------------
            // COMBINE EMPLOYEE + ATTENDANCE
            // --------------------------------------

            const attendance =
                employees.map(
                    employee => {

                        const record =
                            attendanceMap.get(
                                employee.employeeId.toUpperCase()
                            ) || null;


                        const status =
                            calculateAttendanceStatus(
                                record,
                                settings
                            );


                        return {

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

                            date,

                            checkIn:
                                record?.checkIn ||
                                null,

                            checkOut:
                                record?.checkOut ||
                                null,

                            workingHours:
                                record?.workingHours ||
                                0,

                            status,

                            attendanceId:
                                record?._id ||
                                null
                        };
                    }
                );


            // --------------------------------------
            // STATUS FILTER
            // --------------------------------------

            const filteredAttendance =
                statusFilter
                    ? attendance.filter(
                        item =>
                            item.status ===
                            statusFilter
                    )
                    : attendance;


            // --------------------------------------
            // SUMMARY
            // --------------------------------------

            const totalEmployees =
                employees.length;


            const present =
                attendance.filter(
                    item =>
                        item.status ===
                        "Present"
                ).length;


            const late =
                attendance.filter(
                    item =>
                        item.status ===
                        "Late"
                ).length;


            const halfDay =
                attendance.filter(
                    item =>
                        item.status ===
                        "Half Day"
                ).length;


            const absent =
                attendance.filter(
                    item =>
                        item.status ===
                        "Absent"
                ).length;


            const marked =
                present +
                late +
                halfDay;


            const attendanceRate =
                totalEmployees > 0
                    ? Number(
                        (
                            marked /
                            totalEmployees
                        ).toFixed(2)
                    )
                    : 0;


            return res.status(200).json({

                date,

                summary: {

                    totalEmployees,

                    present,

                    late,

                    halfDay,

                    absent,

                    attendanceRate
                },

                attendance:
                    filteredAttendance
            });

        } catch (error) {

            console.error(
                "Admin today attendance error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch admin attendance"
            });
        }
    }
);


// ==================================================
// ADMIN - ATTENDANCE HISTORY
// ==================================================

router.get(
    "/admin/history",
    ...adminOnly,
    async (req, res) => {

        try {

            const {
                employeeId,
                from,
                to,
                status,
                search
            } = req.query;


            const settings =
                await getAttendanceSettings();


            const employeeQuery = {
                isActive: true
            };


            if (employeeId) {

                employeeQuery.employeeId =
                    String(
                        employeeId
                    ).toUpperCase();
            }


            if (search) {

                employeeQuery.$or = [

                    {
                        name: {
                            $regex:
                                search,
                            $options:
                                "i"
                        }
                    },

                    {
                        employeeId: {
                            $regex:
                                search.toUpperCase(),
                            $options:
                                "i"
                        }
                    }
                ];
            }


            const employees =
                await Employee.find(
                    employeeQuery
                )
                    .select(
                        "_id employeeId name email department profileImage"
                    )
                    .sort({
                        name: 1
                    })
                    .lean();


            const employeeIds =
                employees.map(
                    employee =>
                        employee.employeeId
                            .toUpperCase()
                );


            const attendanceQuery = {

                employeeId: {
                    $in: employeeIds
                }
            };


            if (from || to) {

                attendanceQuery.date = {};

                if (from) {
                    attendanceQuery.date.$gte =
                        from;
                }

                if (to) {
                    attendanceQuery.date.$lte =
                        to;
                }
            }


            const records =
                await Attendance.find(
                    attendanceQuery
                )
                    .sort({
                        date: -1
                    })
                    .lean();


            const employeeMap =
                new Map();


            employees.forEach(
                employee => {

                    employeeMap.set(
                        employee.employeeId.toUpperCase(),
                        employee
                    );
                }
            );


            let attendance =
                records.map(
                    record => {

                        const employee =
                            employeeMap.get(
                                record.employeeId.toUpperCase()
                            );


                        return {

                            employeeId:
                                record.employeeId,

                            name:
                                employee?.name ||
                                "Unknown Employee",

                            department:
                                employee?.department ||
                                "",

                            email:
                                employee?.email ||
                                "",

                            profileImage:
                                employee?.profileImage ||
                                "",

                            date:
                                record.date,

                            checkIn:
                                record.checkIn ||
                                null,

                            checkOut:
                                record.checkOut ||
                                null,

                            workingHours:
                                record.workingHours ||
                                0,

                            status:
                                calculateAttendanceStatus(
                                    record,
                                    settings
                                ),

                            attendanceId:
                                record._id
                        };
                    }
                );


            if (status) {

                attendance =
                    attendance.filter(
                        item =>
                            item.status ===
                            status
                    );
            }


            return res.status(200).json({

                attendance,

                total:
                    attendance.length
            });

        } catch (error) {

            console.error(
                "Admin attendance history error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch attendance history"
            });
        }
    }
);


// ==================================================
// ADMIN - EMPLOYEE ATTENDANCE
// ==================================================

router.get(
    "/admin/employee/:employeeId",
    ...adminOnly,
    async (req, res) => {

        try {

            const employeeId =
                String(
                    req.params.employeeId
                ).toUpperCase();


            const employee =
                await Employee.findOne({
                    employeeId
                })
                    .select(
                        "_id employeeId name email department profileImage isActive"
                    )
                    .lean();


            if (!employee) {
                return res.status(404).json({
                    message:
                        "Employee not found"
                });
            }


            const settings =
                await getAttendanceSettings();


            const attendance =
                await Attendance.find({
                    employeeId
                })
                    .sort({
                        date: -1
                    })
                    .lean();


            const history =
                attendance.map(
                    record => ({

                        date:
                            record.date,

                        checkIn:
                            record.checkIn ||
                            null,

                        checkOut:
                            record.checkOut ||
                            null,

                        workingHours:
                            record.workingHours ||
                            0,

                        status:
                            calculateAttendanceStatus(
                                record,
                                settings
                            ),

                        attendanceId:
                            record._id
                    })
                );


            const presentDays =
                history.filter(
                    item =>
                        item.status ===
                        "Present"
                ).length;


            const lateDays =
                history.filter(
                    item =>
                        item.status ===
                        "Late"
                ).length;


            const halfDays =
                history.filter(
                    item =>
                        item.status ===
                        "Half Day"
                ).length;


            const totalWorkingHours =
                history.reduce(
                    (total, item) =>
                        total +
                        Number(
                            item.workingHours || 0
                        ),

                    0
                );


            return res.status(200).json({

                employee,

                summary: {

                    totalDays:
                        history.length,

                    presentDays,

                    lateDays,

                    halfDays,

                    totalWorkingHours:
                        Number(
                            totalWorkingHours.toFixed(2)
                        )
                },

                attendance:
                    history
            });

        } catch (error) {

            console.error(
                "Admin employee attendance error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch employee attendance"
            });
        }
    }
);


// ==================================================
// ADMIN - MONTHLY SUMMARY
// ==================================================

router.get(
    "/admin/monthly-summary",
    ...adminOnly,
    async (req, res) => {

        try {

            const year =
                Number(
                    req.query.year
                ) ||
                new Date().getFullYear();


            const month =
                Number(
                    req.query.month
                ) ||
                new Date().getMonth() + 1;


            const employeeId =
                req.query.employeeId
                    ? String(
                        req.query.employeeId
                    ).toUpperCase()
                    : "";


            const monthString =
                String(month)
                    .padStart(2, "0");


            const startDate =
                `${year}-${monthString}-01`;


            const nextMonth =
                month === 12
                    ? 1
                    : month + 1;


            const nextYear =
                month === 12
                    ? year + 1
                    : year;


            const nextMonthString =
                String(nextMonth)
                    .padStart(2, "0");


            const endDate =
                `${nextYear}-${nextMonthString}-01`;


            const settings =
                await getAttendanceSettings();


            const employeeQuery = {
                isActive: true
            };


            if (employeeId) {
                employeeQuery.employeeId =
                    employeeId;
            }


            const employees =
                await Employee.find(
                    employeeQuery
                )
                    .select(
                        "employeeId name department"
                    )
                    .sort({
                        name: 1
                    })
                    .lean();


            const employeeIds =
                employees.map(
                    employee =>
                        employee.employeeId
                            .toUpperCase()
                );


            const records =
                await Attendance.find({

                    employeeId: {
                        $in: employeeIds
                    },

                    date: {
                        $gte: startDate,
                        $lt: endDate
                    }

                })
                    .sort({
                        date: 1
                    })
                    .lean();


            const recordMap =
                new Map();


            records.forEach(
                record => {

                    const key =
                        record.employeeId
                            .toUpperCase();

                    if (
                        !recordMap.has(key)
                    ) {
                        recordMap.set(
                            key,
                            []
                        );
                    }

                    recordMap
                        .get(key)
                        .push(record);
                }
            );


            const summary =
                employees.map(
                    employee => {

                        const key =
                            employee.employeeId
                                .toUpperCase();


                        const employeeRecords =
                            recordMap.get(key) ||
                            [];


                        let presentDays = 0;
                        let lateDays = 0;
                        let halfDays = 0;
                        let totalWorkingHours = 0;


                        employeeRecords.forEach(
                            record => {

                                const status =
                                    calculateAttendanceStatus(
                                        record,
                                        settings
                                    );


                                if (
                                    status ===
                                    "Present"
                                ) {
                                    presentDays++;
                                }


                                if (
                                    status ===
                                    "Late"
                                ) {
                                    lateDays++;
                                }


                                if (
                                    status ===
                                    "Half Day"
                                ) {
                                    halfDays++;
                                }


                                totalWorkingHours +=
                                    Number(
                                        record.workingHours ||
                                        0
                                    );
                            }
                        );


                        return {

                            employeeId:
                                employee.employeeId,

                            name:
                                employee.name,

                            department:
                                employee.department,

                            totalDays:
                                employeeRecords.length,

                            presentDays,

                            lateDays,

                            halfDays,

                            totalWorkingHours:
                                Number(
                                    totalWorkingHours.toFixed(2)
                                )
                        };
                    }
                );


            return res.status(200).json({

                year,

                month,

                summary
            });

        } catch (error) {

            console.error(
                "Admin monthly summary error:",
                error
            );

            return res.status(500).json({
                message:
                    "Failed to fetch admin monthly summary"
            });
        }
    }
);


module.exports = router;