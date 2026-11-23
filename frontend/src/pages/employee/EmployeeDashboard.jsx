import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import employeeAPI from "../../services/employeeApi";
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {

    const navigate = useNavigate();

    const employee = JSON.parse(
        localStorage.getItem("employeeUser") || "{}"
    );


    const [monthlySummary, setMonthlySummary] = useState({
        presentDays: 0,
        absentDays: 0,
        totalWorkingHours: 0,
        lateArrivals: 0
    });


    const [summaryLoading, setSummaryLoading] =
        useState(true);


    // =====================================================
    // ANNOUNCEMENT STATES
    // =====================================================

    const [announcement, setAnnouncement] =
        useState(null);

    const [announcementLoading, setAnnouncementLoading] =
        useState(true);

    const [showAnnouncement, setShowAnnouncement] =
        useState(false);


    const today =
        new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    // =====================================================
    // LOAD MONTHLY ATTENDANCE SUMMARY
    // =====================================================

    useEffect(() => {

        const loadMonthlySummary =
            async () => {

                try {

                    setSummaryLoading(true);


                    const response =
                        await employeeAPI.get(
                            "/attendance/monthly-summary"
                        );


                    console.log(
                        "Monthly attendance summary:",
                        response.data
                    );


                    const summary =
                        response.data.summary || {};


                    setMonthlySummary({

                        presentDays:
                            Number(
                                summary.presentDays ??
                                summary.present ??
                                0
                            ),

                        absentDays:
                            Number(
                                summary.absentDays ??
                                summary.absent ??
                                0
                            ),

                        totalWorkingHours:
                            Number(
                                summary.totalWorkingHours ??
                                summary.workingHours ??
                                summary.totalHours ??
                                0
                            ),

                        lateArrivals:
                            Number(
                                summary.lateArrivals ??
                                summary.late ??
                                0
                            )

                    });


                } catch (error) {

                    console.error(
                        "Monthly summary error:",
                        error
                    );


                    setMonthlySummary({

                        presentDays: 0,
                        absentDays: 0,
                        totalWorkingHours: 0,
                        lateArrivals: 0

                    });


                } finally {

                    setSummaryLoading(false);

                }

            };


        loadMonthlySummary();

    }, []);


    // =====================================================
    // LOAD NEW ANNOUNCEMENT
    // =====================================================

    useEffect(() => {

        const loadAnnouncement =
            async () => {

                try {

                    setAnnouncementLoading(true);


                    const response =
                        await employeeAPI.get(
                            "/notifications"
                        );


                    const notifications =
                        response.data.notifications || [];


                    /*
                        Only unread announcement
                        notifications will be shown.
                    */

                    const latestAnnouncement =
                        notifications.find(
                            (notification) =>

                                [
                                    "announcement",
                                    "holiday",
                                    "important"
                                ].includes(
                                    notification.type
                                ) &&

                                notification.isRead === false
                        );


                    if (latestAnnouncement) {

                        setAnnouncement(
                            latestAnnouncement
                        );

                        setShowAnnouncement(
                            true
                        );

                    } else {

                        setAnnouncement(null);

                        setShowAnnouncement(
                            false
                        );

                    }


                } catch (error) {

                    console.error(
                        "Announcement loading error:",
                        error
                    );


                    setAnnouncement(null);

                    setShowAnnouncement(
                        false
                    );


                } finally {

                    setAnnouncementLoading(
                        false
                    );

                }

            };


        loadAnnouncement();

    }, []);


    // =====================================================
    // CLOSE ANNOUNCEMENT
    // =====================================================

    const handleCloseAnnouncement =
        async () => {

            if (!announcement) {
                return;
            }


            try {

                await employeeAPI.patch(
                    `/notifications/${announcement._id}/read`
                );


            } catch (error) {

                console.error(
                    "Mark announcement read error:",
                    error
                );


            } finally {

                setShowAnnouncement(false);

            }

        };


    // =====================================================
    // FORMAT WORKING HOURS
    // =====================================================

    const formatWorkingHours =
        (hours) => {

            if (
                !hours ||
                Number(hours) <= 0
            ) {

                return "0h 00m";

            }


            const totalMinutes =
                Math.round(
                    Number(hours) * 60
                );


            const h =
                Math.floor(
                    totalMinutes / 60
                );


            const m =
                totalMinutes % 60;


            return `${h}h ${String(m).padStart(2, "0")}m`;

        };


    // =====================================================
    // DASHBOARD STATS
    // =====================================================

    const stats = [

        {
            title: "Present Days",

            value:
                summaryLoading
                    ? "..."
                    : monthlySummary.presentDays,

            subtitle: "This month",

            icon: "bi-calendar-check",

            color: "green"
        },


        {
            title: "Absent Days",

            value:
                summaryLoading
                    ? "..."
                    : monthlySummary.absentDays,

            subtitle: "This month",

            icon: "bi-calendar-x",

            color: "red"
        },


        {
            title: "Total Working Hours",

            value:
                summaryLoading
                    ? "..."
                    : formatWorkingHours(
                        monthlySummary.totalWorkingHours
                    ),

            subtitle: "This month",

            icon: "bi-clock",

            color: "blue"
        },


        {
            title: "Late Arrivals",

            value:
                summaryLoading
                    ? "..."
                    : monthlySummary.lateArrivals,

            subtitle: "This month",

            icon: "bi-alarm",

            color: "orange"
        }

    ];


    // =====================================================
    // RETURN
    // =====================================================

    return (

        <div className="employee-dashboard">


            {/* =================================================
                ANNOUNCEMENT POPUP
            ================================================= */}

            {showAnnouncement &&
                announcement && (

                    <div
                        className="employee-announcement-overlay"
                        onClick={
                            handleCloseAnnouncement
                        }
                    >

                        <div
                            className={
                                `employee-announcement-modal ${announcement.type}`
                            }
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >


                            {/* ICON */}

                            <div className="employee-announcement-icon">

                                {announcement.type ===
                                    "holiday" ? (

                                    <i className="bi bi-calendar-heart"></i>

                                ) : announcement.type ===
                                    "important" ? (

                                    <i className="bi bi-exclamation-triangle"></i>

                                ) : (

                                    <i className="bi bi-megaphone"></i>

                                )}

                            </div>


                            {/* TYPE */}

                            <span className="employee-announcement-type">

                                {announcement.type ===
                                    "holiday"

                                    ? "HOLIDAY NOTICE"

                                    : announcement.type ===
                                        "important"

                                        ? "IMPORTANT NOTICE"

                                        : "ANNOUNCEMENT"}

                            </span>


                            {/* TITLE */}

                            <h2>
                                {announcement.title}
                            </h2>


                            {/* MESSAGE */}
                            <p>
                                {announcement.message}
                            </p>


                            {announcement.type === "holiday" && (
                                <div className="employee-holiday-dates">

                                    <div className="employee-holiday-date">

                                        <i className="bi bi-calendar-event"></i>

                                        <div>
                                            <span>
                                                Holiday From
                                            </span>

                                            <strong>
                                                {announcement.holidayFrom
                                                    ? new Date(
                                                        `${announcement.holidayFrom}T00:00:00`
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric"
                                                        }
                                                    )
                                                    : "Date not available"}
                                            </strong>
                                        </div>

                                    </div>


                                    <div className="employee-holiday-arrow">
                                        <i className="bi bi-arrow-down"></i>
                                    </div>


                                    <div className="employee-holiday-date">

                                        <i className="bi bi-calendar-check"></i>

                                        <div>
                                            <span>
                                                Holiday To
                                            </span>

                                            <strong>
                                                {announcement.holidayTo
                                                    ? new Date(
                                                        `${announcement.holidayTo}T00:00:00`
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric"
                                                        }
                                                    )
                                                    : "Date not available"}
                                            </strong>
                                        </div>

                                    </div>

                                </div>
                            )}


                            <small>
                                Notice issued on{" "}
                                {new Date(
                                    announcement.createdAt
                                ).toLocaleDateString(
                                    "en-IN",
                                    {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                    }
                                )}
                            </small>


                            {/* BUTTON */}

                            <button
                                type="button"
                                className="employee-announcement-btn"
                                onClick={
                                    handleCloseAnnouncement
                                }
                            >
                                Got it
                            </button>


                        </div>

                    </div>

                )}


            {/* ==================================
                WELCOME SECTION
            ================================== */}

            <div className="employee-welcome-section">

                <div>

                    <span className="employee-welcome-tag">
                        EMPLOYEE OVERVIEW
                    </span>


                    <h2>

                        Welcome back,{" "}

                        {employee.name ||
                            "Employee"}!

                    </h2>


                    <p>
                        Here's your attendance and
                        work overview.
                    </p>

                </div>


                <div className="employee-current-date">

                    <i className="bi bi-calendar3"></i>

                    <span>
                        {today}
                    </span>

                </div>

            </div>


            {/* ==================================
                EMPLOYEE PROFILE
            ================================== */}

            <div className="employee-profile-banner">

                <div className="employee-banner-avatar">

                    {(employee.name || "E")
                        .charAt(0)
                        .toUpperCase()}

                </div>


                <div className="employee-banner-info">

                    <span>
                        EMPLOYEE ACCOUNT
                    </span>


                    <h3>
                        {employee.name ||
                            "Employee"}
                    </h3>


                    <p>

                        {employee.employeeId ||
                            "Employee ID"}

                        {employee.department
                            ? ` • ${employee.department}`
                            : ""}

                    </p>

                </div>


                <button
                    className="employee-view-profile"
                    onClick={() =>
                        navigate(
                            "/employee/profile"
                        )
                    }
                >

                    View Profile

                    <i className="bi bi-arrow-right"></i>

                </button>

            </div>


            {/* ==================================
                ATTENDANCE OVERVIEW
            ================================== */}

            <div className="employee-section-heading">

                <div>

                    <h3>
                        Attendance Overview
                    </h3>

                    <p>
                        Your monthly attendance summary
                    </p>

                </div>


                <button
                    className="employee-text-button"
                    onClick={() =>
                        navigate(
                            "/employee/history"
                        )
                    }
                >

                    View History

                    <i className="bi bi-arrow-right"></i>

                </button>

            </div>


            {/* ==================================
                ATTENDANCE STATS
            ================================== */}

            <div className="employee-stats-grid">

                {stats.map((stat) => (

                    <div
                        className="employee-stat-card"
                        key={stat.title}
                    >

                        <div
                            className={
                                `employee-stat-icon ${stat.color}`
                            }
                        >

                            <i
                                className={
                                    `bi ${stat.icon}`
                                }
                            ></i>

                        </div>


                        <div className="employee-stat-value">

                            {stat.value}

                        </div>


                        <h4>
                            {stat.title}
                        </h4>


                        <p>
                            {stat.subtitle}
                        </p>

                    </div>

                ))}

            </div>


            {/* ==================================
                BOTTOM SECTION
            ================================== */}

            <div className="employee-dashboard-bottom">


                {/* RECENT ACTIVITY */}

                <div className="employee-panel employee-activity-panel">

                    <div className="employee-panel-heading">

                        <div>

                            <h3>
                                Recent Activity
                            </h3>

                            <p>
                                Your latest attendance updates
                            </p>

                        </div>


                        <i className="bi bi-activity"></i>

                    </div>


                    <div className="employee-empty-state">

                        <div className="employee-empty-icon">

                            <i className="bi bi-calendar2-week"></i>

                        </div>


                        <h4>
                            No Attendance Records Yet
                        </h4>


                        <p>
                            Your attendance activity
                            will appear here once
                            attendance records are
                            available.
                        </p>

                    </div>

                </div>


                {/* QUICK ACCESS */}

                <div className="employee-panel employee-quick-panel">

                    <div className="employee-panel-heading">

                        <div>

                            <h3>
                                Quick Access
                            </h3>

                            <p>
                                Manage your account
                            </p>

                        </div>


                        <i className="bi bi-lightning-charge"></i>

                    </div>


                    <button
                        className="employee-quick-link"
                        onClick={() =>
                            navigate(
                                "/employee/profile"
                            )
                        }
                    >

                        <span className="employee-quick-icon">

                            <i className="bi bi-person"></i>

                        </span>


                        <span>

                            <strong>
                                My Profile
                            </strong>

                            <small>
                                View your personal details
                            </small>

                        </span>


                        <i className="bi bi-chevron-right"></i>

                    </button>


                    <button
                        className="employee-quick-link"
                        onClick={() =>
                            navigate(
                                "/employee/history"
                            )
                        }
                    >

                        <span className="employee-quick-icon">

                            <i className="bi bi-calendar3"></i>

                        </span>


                        <span>

                            <strong>
                                Attendance History
                            </strong>

                            <small>
                                Check your attendance records
                            </small>

                        </span>


                        <i className="bi bi-chevron-right"></i>

                    </button>


                    <button
                        className="employee-quick-link"
                        onClick={() =>
                            navigate(
                                "/employee/settings"
                            )
                        }
                    >

                        <span className="employee-quick-icon">

                            <i className="bi bi-gear"></i>

                        </span>


                        <span>

                            <strong>
                                Account Settings
                            </strong>

                            <small>
                                Manage your account
                            </small>

                        </span>


                        <i className="bi bi-chevron-right"></i>

                    </button>

                </div>

            </div>

        </div>

    );

};

export default EmployeeDashboard;