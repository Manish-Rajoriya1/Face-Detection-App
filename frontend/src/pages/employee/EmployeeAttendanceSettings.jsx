import { useEffect, useState } from "react";
import {
    FaClock,
    FaCalendarAlt,
    FaCoffee,
    FaLock,
    FaBell,
    FaMoon,
    FaInfoCircle
} from "react-icons/fa";

import employeeAPI from "../../services/employeeApi";
import "./EmployeeAttendanceSettings.css";

const EmployeeAttendanceSettings = () => {

    const [settings, setSettings] = useState(null);

    const [notifications, setNotifications] = useState({
        attendanceReminder:
            localStorage.getItem(
                "attendanceReminder"
            ) !== "false",

        lateReminder:
            localStorage.getItem(
                "lateReminder"
            ) !== "false",

        checkoutReminder:
            localStorage.getItem(
                "checkoutReminder"
            ) !== "false"
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await employeeAPI.get(
                        "/attendance-settings/employee"
                    );

                setSettings(
                    response.data.settings
                );

            } catch (err) {
                console.error(
                    "Attendance settings error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to load attendance settings."
                );

            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);


    const toggleNotification = (key) => {

        const newValue =
            !notifications[key];

        setNotifications((prev) => ({
            ...prev,
            [key]: newValue
        }));

        localStorage.setItem(
            key,
            String(newValue)
        );
    };


    const formatTime = (time) => {

        if (!time) return "--";

        const [hour, minute] =
            time.split(":");

        const date = new Date();

        date.setHours(
            Number(hour),
            Number(minute)
        );

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    const getWorkingDays = () => {

        if (
            !settings?.workingDays?.length
        ) {
            return "--";
        }

        const days = {
            0: "Sunday",
            1: "Monday",
            2: "Tuesday",
            3: "Wednesday",
            4: "Thursday",
            5: "Friday",
            6: "Saturday"
        };

        return settings.workingDays
            .map((day) => days[day])
            .join(" • ");
    };


    if (loading) {
        return (
            <div className="employee-attendance-settings">

                <div className="employee-settings-loading">

                    <div className="employee-settings-spinner"></div>

                    <p>
                        Loading attendance settings...
                    </p>

                </div>

            </div>
        );
    }


    return (
        <div className="employee-attendance-settings">

            {/* PAGE HEADER */}

            <div className="employee-settings-header">

                <div>

                    <span className="employee-settings-label">
                        ATTENDANCE
                    </span>

                    <h2>
                        Attendance Settings
                    </h2>

                    <p>
                        View your attendance policy and
                        manage notification preferences.
                    </p>

                </div>

                <div className="employee-settings-lock">
                    <FaLock />
                    <span>
                        Admin Managed
                    </span>
                </div>

            </div>


            {/* ERROR */}

            {error && (
                <div className="employee-settings-error">
                    <FaInfoCircle />
                    <span>{error}</span>
                </div>
            )}


            {/* ATTENDANCE POLICY */}

            <div className="employee-settings-card">

                <div className="employee-settings-card-header">

                    <div className="employee-settings-card-title">

                        <div className="employee-settings-title-icon">
                            <FaClock />
                        </div>

                        <div>
                            <h3>
                                Attendance Policy
                            </h3>

                            <p>
                                Rules configured by your administrator
                            </p>
                        </div>

                    </div>

                    <span className="employee-readonly-badge">
                        <FaLock />
                        Read Only
                    </span>

                </div>


                <div className="employee-policy-grid">

                    <div className="employee-policy-item">

                        <span>
                            Office Start
                        </span>

                        <strong>
                            {formatTime(
                                settings?.officeStartTime
                            )}
                        </strong>

                    </div>


                    <div className="employee-policy-item">

                        <span>
                            Office End
                        </span>

                        <strong>
                            {formatTime(
                                settings?.officeEndTime
                            )}
                        </strong>

                    </div>


                    <div className="employee-policy-item">

                        <span>
                            Late After
                        </span>

                        <strong>
                            {settings?.lateAfterMinutes ?? 0}
                            {" "}minutes
                        </strong>

                    </div>


                    <div className="employee-policy-item">

                        <span>
                            Half Day After
                        </span>

                        <strong>
                            {formatTime(
                                settings?.halfDayAfterTime
                            )}
                        </strong>

                    </div>


                    <div className="employee-policy-item">

                        <span>
                            Full Day Minimum
                        </span>

                        <strong>
                            {settings?.minimumFullDayHours ?? 0}
                            {" "}hours
                        </strong>

                    </div>


                    <div className="employee-policy-item">

                        <span>
                            Half Day Minimum
                        </span>

                        <strong>
                            {settings?.minimumHalfDayHours ?? 0}
                            {" "}hours
                        </strong>

                    </div>


                    <div className="employee-policy-item">

                        <span>
                            Working Days
                        </span>

                        <strong>
                            {getWorkingDays()}
                        </strong>

                    </div>


                    <div className="employee-policy-item">

                        <span>
                            Attendance Finalize
                        </span>

                        <strong>
                            {formatTime(
                                settings?.attendanceFinalizeTime
                            )}
                        </strong>

                    </div>

                </div>

            </div>


            {/* LUNCH */}

            <div className="employee-settings-card">

                <div className="employee-settings-card-header">

                    <div className="employee-settings-card-title">

                        <div className="employee-settings-title-icon lunch">
                            <FaCoffee />
                        </div>

                        <div>
                            <h3>
                                Lunch Break
                            </h3>

                            <p>
                                Configured office lunch timing
                            </p>
                        </div>

                    </div>

                    <span
                        className={
                            settings?.lunchEnabled
                                ? "employee-enabled-badge"
                                : "employee-disabled-badge"
                        }
                    >
                        {settings?.lunchEnabled
                            ? "Enabled"
                            : "Disabled"}
                    </span>

                </div>


                {settings?.lunchEnabled && (
                    <div className="employee-lunch-info">

                        <div>
                            <span>
                                Lunch Start
                            </span>

                            <strong>
                                {formatTime(
                                    settings?.lunchStartTime
                                )}
                            </strong>
                        </div>

                        <div className="employee-lunch-arrow">
                            →
                        </div>

                        <div>
                            <span>
                                Lunch End
                            </span>

                            <strong>
                                {formatTime(
                                    settings?.lunchEndTime
                                )}
                            </strong>
                        </div>

                    </div>
                )}

            </div>


            {/* NOTIFICATIONS */}

            <div className="employee-settings-card">

                <div className="employee-settings-card-header">

                    <div className="employee-settings-card-title">

                        <div className="employee-settings-title-icon notification">
                            <FaBell />
                        </div>

                        <div>
                            <h3>
                                My Notifications
                            </h3>

                            <p>
                                Manage your attendance reminders
                            </p>
                        </div>

                    </div>

                </div>


                <div className="employee-notification-list">

                    <div className="employee-notification-item">

                        <div className="employee-notification-info">

                            <div className="employee-notification-icon">
                                <FaCalendarAlt />
                            </div>

                            <div>
                                <strong>
                                    Attendance Reminder
                                </strong>

                                <span>
                                    Get reminders about your attendance
                                </span>
                            </div>

                        </div>

                        <button
                            type="button"
                            className={
                                notifications.attendanceReminder
                                    ? "employee-toggle active"
                                    : "employee-toggle"
                            }
                            onClick={() =>
                                toggleNotification(
                                    "attendanceReminder"
                                )
                            }
                        >
                            <span></span>
                        </button>

                    </div>


                    <div className="employee-notification-item">

                        <div className="employee-notification-info">

                            <div className="employee-notification-icon">
                                <FaClock />
                            </div>

                            <div>
                                <strong>
                                    Late Arrival Reminder
                                </strong>

                                <span>
                                    Get notified about late attendance
                                </span>
                            </div>

                        </div>

                        <button
                            type="button"
                            className={
                                notifications.lateReminder
                                    ? "employee-toggle active"
                                    : "employee-toggle"
                            }
                            onClick={() =>
                                toggleNotification(
                                    "lateReminder"
                                )
                            }
                        >
                            <span></span>
                        </button>

                    </div>


                    <div className="employee-notification-item">

                        <div className="employee-notification-info">

                            <div className="employee-notification-icon">
                                <FaMoon />
                            </div>

                            <div>
                                <strong>
                                    Check-out Reminder
                                </strong>

                                <span>
                                    Get reminded when you forget to check out
                                </span>
                            </div>

                        </div>

                        <button
                            type="button"
                            className={
                                notifications.checkoutReminder
                                    ? "employee-toggle active"
                                    : "employee-toggle"
                            }
                            onClick={() =>
                                toggleNotification(
                                    "checkoutReminder"
                                )
                            }
                        >
                            <span></span>
                        </button>

                    </div>

                </div>

            </div>


            {/* INFORMATION */}

            <div className="employee-attendance-info">

                <div className="employee-info-icon">
                    <FaInfoCircle />
                </div>

                <div>

                    <h4>
                        How Attendance Works
                    </h4>

                    <p>
                        Your attendance status, working hours,
                        late arrival and half-day calculation
                        are automatically determined according
                        to the attendance policy configured by
                        your administrator.
                    </p>

                    <p>
                        If you have any questions about your
                        attendance rules, please contact your
                        administrator.
                    </p>

                </div>

            </div>

        </div>
    );
};

export default EmployeeAttendanceSettings;