import { useEffect, useState } from "react";
import employeeAPI from "../../services/employeeApi";
import "./MonthlySummary.css";

const MonthlySummary = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const today = new Date();

        return `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}`;
    });

    const employee = JSON.parse(
        localStorage.getItem("employeeUser") || "{}"
    );

    useEffect(() => {
        loadMonthlySummary();
    }, [selectedMonth]);

    const loadMonthlySummary = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await employeeAPI.get(
                "/attendance/monthly-summary",
                {
                    params: {
                        month: selectedMonth
                    }
                }
            );

            setSummary(
                response.data?.summary ||
                response.data ||
                null
            );
        } catch (error) {
            console.error(
                "Monthly summary error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load monthly summary."
            );
        } finally {
            setLoading(false);
        }
    };

    const getValue = (...keys) => {
        for (const key of keys) {
            if (
                summary &&
                summary[key] !== undefined &&
                summary[key] !== null
            ) {
                return summary[key];
            }
        }

        return 0;
    };

    const totalDays = getValue(
        "totalDays",
        "totalRecords",
        "total"
    );

    const presentDays = getValue(
        "presentDays",
        "present"
    );

    const absentDays = getValue(
        "absentDays",
        "absent"
    );

    const lateDays = getValue(
        "lateDays",
        "late"
    );

    const halfDays = getValue(
        "halfDays",
        "halfDay"
    );

    const workingHours = getValue(
        "totalWorkingHours",
        "workingHours",
        "totalHours"
    );

    const formatHours = (hours) => {
        const numericHours = Number(hours);

        if (Number.isNaN(numericHours)) {
            return "0h";
        }

        const hrs = Math.floor(numericHours);
        const mins = Math.round(
            (numericHours - hrs) * 60
        );

        if (hrs === 0) {
            return `${mins}m`;
        }

        return `${hrs}h ${mins}m`;
    };

    const attendancePercentage =
        Number(totalDays) > 0
            ? Math.round(
                (Number(presentDays) /
                    Number(totalDays)) *
                100
            )
            : 0;

    const getMonthName = () => {
        if (!selectedMonth) return "";

        const [year, month] =
            selectedMonth.split("-");

        const date = new Date(
            Number(year),
            Number(month) - 1
        );

        return date.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );
    };

    return (
        <div className="monthly-summary-page">

            {/* Header */}

            <div className="monthly-summary-header">

                <div>
                    <h1>Monthly Summary</h1>

                    <p>
                        Track your monthly attendance
                        performance
                    </p>
                </div>

                <div className="monthly-employee">
                    <span>
                        {employee?.employeeId ||
                            "Employee"}
                    </span>

                    <strong>
                        {employee?.name || ""}
                    </strong>
                </div>

            </div>

            {/* Month Selector */}

            <div className="monthly-filter-card">

                <div>
                    <label>
                        Select Month
                    </label>

                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) =>
                            setSelectedMonth(
                                e.target.value
                            )
                        }
                    />
                </div>

                <div className="selected-month-text">
                    {getMonthName()}
                </div>

            </div>

            {/* Error */}

            {error && (
                <div className="monthly-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="monthly-loading">

                    <div className="monthly-spinner"></div>

                    <p>
                        Loading monthly summary...
                    </p>

                </div>
            ) : (
                <>

                    {/* Main Stats */}

                    <div className="monthly-stat-grid">

                        <div className="monthly-stat-card total">

                            <div className="monthly-stat-icon">
                                📅
                            </div>

                            <div>
                                <span>
                                    Total Records
                                </span>

                                <strong>
                                    {totalDays}
                                </strong>
                            </div>

                        </div>

                        <div className="monthly-stat-card present">

                            <div className="monthly-stat-icon">
                                ✓
                            </div>

                            <div>
                                <span>
                                    Present
                                </span>

                                <strong>
                                    {presentDays}
                                </strong>
                            </div>

                        </div>

                        <div className="monthly-stat-card absent">

                            <div className="monthly-stat-icon">
                                ✕
                            </div>

                            <div>
                                <span>
                                    Absent
                                </span>

                                <strong>
                                    {absentDays}
                                </strong>
                            </div>

                        </div>

                        <div className="monthly-stat-card late">

                            <div className="monthly-stat-icon">
                                ⏰
                            </div>

                            <div>
                                <span>
                                    Late
                                </span>

                                <strong>
                                    {lateDays}
                                </strong>
                            </div>

                        </div>

                        <div className="monthly-stat-card half">

                            <div className="monthly-stat-icon">
                                ½
                            </div>

                            <div>
                                <span>
                                    Half Day
                                </span>

                                <strong>
                                    {halfDays}
                                </strong>
                            </div>

                        </div>

                        <div className="monthly-stat-card hours">

                            <div className="monthly-stat-icon">
                                ⌛
                            </div>

                            <div>
                                <span>
                                    Working Hours
                                </span>

                                <strong>
                                    {formatHours(
                                        workingHours
                                    )}
                                </strong>
                            </div>

                        </div>

                    </div>

                    {/* Attendance Percentage */}

                    <div className="attendance-performance-card">

                        <div className="performance-header">

                            <div>
                                <h2>
                                    Attendance Performance
                                </h2>

                                <p>
                                    {getMonthName()}
                                </p>
                            </div>

                            <strong className="performance-percentage">
                                {attendancePercentage}%
                            </strong>

                        </div>

                        <div className="progress-background">

                            <div
                                className="progress-fill"
                                style={{
                                    width: `${Math.min(
                                        attendancePercentage,
                                        100
                                    )}%`
                                }}
                            ></div>

                        </div>

                        <div className="performance-footer">

                            <span>
                                Present:{" "}
                                <strong>
                                    {presentDays}
                                </strong>
                            </span>

                            <span>
                                Total:{" "}
                                <strong>
                                    {totalDays}
                                </strong>
                            </span>

                        </div>

                    </div>

                    {/* Quick Information */}

                    <div className="monthly-info-grid">

                        <div className="monthly-info-card">

                            <h3>
                                Attendance Rate
                            </h3>

                            <p>
                                Your attendance rate
                                for {getMonthName()} is
                                <strong>
                                    {" "}
                                    {attendancePercentage}%
                                </strong>.
                            </p>

                        </div>

                        <div className="monthly-info-card">

                            <h3>
                                Total Working Hours
                            </h3>

                            <p>
                                You have completed
                                <strong>
                                    {" "}
                                    {formatHours(
                                        workingHours
                                    )}
                                </strong>{" "}
                                of working hours this
                                month.
                            </p>

                        </div>

                    </div>

                </>
            )}

        </div>
    );
};

export default MonthlySummary;