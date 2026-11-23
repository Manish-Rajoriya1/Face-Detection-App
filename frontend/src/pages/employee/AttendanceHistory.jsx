import { useEffect, useState } from "react";
import employeeAPI from "../../services/employeeApi";
import "./AttendanceHistory.css";

const AttendanceHistory = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

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
        loadAttendanceHistory();
    }, [selectedMonth]);

    const loadAttendanceHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await employeeAPI.get(
                "/attendance/history",
                {
                    params: {
                        month: selectedMonth
                    }
                }
            );

            const data = response.data;

            if (Array.isArray(data)) {
                setAttendance(data);
            } else if (Array.isArray(data.attendance)) {
                setAttendance(data.attendance);
            } else if (Array.isArray(data.records)) {
                setAttendance(data.records);
            } else {
                setAttendance([]);
            }

            setCurrentPage(1);
        } catch (error) {
            console.error(
                "Attendance history error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load attendance history."
            );
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatTime = (time) => {
        if (!time) return "-";

        const parsedTime = new Date(time);

        if (Number.isNaN(parsedTime.getTime())) {
            return time;
        }

        return parsedTime.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    };

    const formatWorkingHours = (hours) => {
        if (
            hours === null ||
            hours === undefined ||
            hours === ""
        ) {
            return "-";
        }

        const numericHours = Number(hours);

        if (Number.isNaN(numericHours)) {
            return hours;
        }

        const hrs = Math.floor(numericHours);
        const mins = Math.round(
            (numericHours - hrs) * 60
        );

        if (hrs === 0) {
            return `${mins} min`;
        }

        return `${hrs}h ${mins}m`;
    };

    const getStatusClass = (status) => {
        if (!status) return "";

        return status
            .toLowerCase()
            .replace(/\s+/g, "-");
    };

    // Pagination
    const totalPages = Math.ceil(
        attendance.length / recordsPerPage
    );

    const startIndex =
        (currentPage - 1) * recordsPerPage;

    const currentRecords = attendance.slice(
        startIndex,
        startIndex + recordsPerPage
    );

    const changePage = (page) => {
        if (
            page < 1 ||
            page > totalPages
        ) {
            return;
        }

        setCurrentPage(page);
    };

    return (
        <div className="attendance-history-page">

            {/* Header */}
            <div className="attendance-history-header">

                <div>
                    <h1>Attendance History</h1>

                    <p>
                        View your complete attendance
                        records
                    </p>
                </div>

                <div className="history-employee-info">
                    <span>
                        {employee?.employeeId || "Employee"}
                    </span>

                    <strong>
                        {employee?.name || ""}
                    </strong>
                </div>

            </div>

            {/* Filter */}
            <div className="history-filter-card">

                <div className="history-filter-left">

                    <div className="filter-icon">
                        📅
                    </div>

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

                </div>

                <button
                    className="refresh-history-btn"
                    onClick={loadAttendanceHistory}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>

            </div>

            {/* Summary */}
            <div className="history-mini-summary">

                <div className="history-summary-card">
                    <span className="summary-number">
                        {attendance.length}
                    </span>

                    <span className="summary-label">
                        Total Records
                    </span>
                </div>

                <div className="history-summary-card present">
                    <span className="summary-number">
                        {
                            attendance.filter(
                                (item) =>
                                    item.status ===
                                    "Present"
                            ).length
                        }
                    </span>

                    <span className="summary-label">
                        Present
                    </span>
                </div>

                <div className="history-summary-card absent">
                    <span className="summary-number">
                        {
                            attendance.filter(
                                (item) =>
                                    item.status ===
                                    "Absent"
                            ).length
                        }
                    </span>

                    <span className="summary-label">
                        Absent
                    </span>
                </div>

                <div className="history-summary-card late">
                    <span className="summary-number">
                        {
                            attendance.filter(
                                (item) =>
                                    item.status ===
                                    "Late"
                            ).length
                        }
                    </span>

                    <span className="summary-label">
                        Late
                    </span>
                </div>

            </div>

            {/* Error */}
            {error && (
                <div className="history-error">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="attendance-table-card">

                <div className="table-card-header">
                    <div>
                        <h2>Attendance Records</h2>

                        <p>
                            Month:{" "}
                            {selectedMonth}
                        </p>
                    </div>

                    <span className="record-count">
                        {attendance.length} Records
                    </span>
                </div>

                {loading ? (
                    <div className="history-loading">
                        <div className="history-spinner"></div>

                        <p>
                            Loading attendance history...
                        </p>
                    </div>
                ) : attendance.length === 0 ? (
                    <div className="history-empty">
                        <div className="empty-icon">
                            📅
                        </div>

                        <h3>
                            No Attendance Records
                        </h3>

                        <p>
                            No attendance records found
                            for the selected month.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="attendance-table-wrapper">

                            <table className="attendance-history-table">

                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Date</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Working Hours</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {currentRecords.map(
                                        (record, index) => (
                                            <tr
                                                key={
                                                    record._id ||
                                                    `${record.date}-${index}`
                                                }
                                            >

                                                <td>
                                                    {startIndex +
                                                        index +
                                                        1}
                                                </td>

                                                <td className="date-cell">
                                                    {formatDate(
                                                        record.date
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="time-value">
                                                        {formatTime(
                                                            record.checkIn
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="time-value">
                                                        {formatTime(
                                                            record.checkOut
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="working-hours">
                                                        {formatWorkingHours(
                                                            record.workingHours
                                                        )}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`attendance-status ${getStatusClass(
                                                            record.status
                                                        )}`}
                                                    >
                                                        {
                                                            record.status ||
                                                            "-"
                                                        }
                                                    </span>
                                                </td>

                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="history-pagination">

                                <button
                                    onClick={() =>
                                        changePage(
                                            currentPage - 1
                                        )
                                    }
                                    disabled={
                                        currentPage === 1
                                    }
                                >
                                    ← Previous
                                </button>

                                <div className="page-numbers">

                                    {Array.from(
                                        {
                                            length: totalPages
                                        },
                                        (_, index) => (
                                            <button
                                                key={index}
                                                className={
                                                    currentPage ===
                                                        index + 1
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    changePage(
                                                        index + 1
                                                    )
                                                }
                                            >
                                                {index + 1}
                                            </button>
                                        )
                                    )}

                                </div>

                                <button
                                    onClick={() =>
                                        changePage(
                                            currentPage + 1
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                >
                                    Next →
                                </button>

                            </div>
                        )}
                    </>
                )}

            </div>

        </div>
    );
};

export default AttendanceHistory;