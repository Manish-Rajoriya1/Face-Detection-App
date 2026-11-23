import { useEffect, useState } from "react";
import {
    FaUsers,
    FaUserCheck,
    FaUserClock,
    FaUserTimes,
    FaSearch,
    FaSyncAlt,
    FaCalendarAlt
} from "react-icons/fa";

import API from "../../services/api";
import "./AdminAttendance.css";

function AdminAttendance() {

    const getToday = () => {
        return new Date()
            .toISOString()
            .split("T")[0];
    };

    const [date, setDate] =
        useState(getToday());

    const [search, setSearch] =
        useState("");

    const [status, setStatus] =
        useState("");

    const [attendance, setAttendance] =
        useState([]);

    const [summary, setSummary] =
        useState({
            totalEmployees: 0,
            present: 0,
            late: 0,
            halfDay: 0,
            absent: 0,
            attendanceRate: 0
        });

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    // ==========================================
    // FETCH ATTENDANCE
    // ==========================================

    const fetchAttendance = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await API.get(
                    "/attendance/admin/today",
                    {
                        params: {
                            date,
                            search,
                            status
                        }
                    }
                );

            setAttendance(
                response.data.attendance || []
            );

            setSummary(
                response.data.summary || {
                    totalEmployees: 0,
                    present: 0,
                    late: 0,
                    halfDay: 0,
                    absent: 0,
                    attendanceRate: 0
                }
            );

        } catch (error) {

            console.error(
                "Admin attendance error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to load attendance."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        fetchAttendance();

    }, [date, status]);


    // ==========================================
    // FORMAT TIME
    // ==========================================

    const formatTime = (value) => {

        if (!value) {
            return "--";
        }

        return new Date(value)
            .toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                }
            );
    };


    // ==========================================
    // FORMAT HOURS
    // ==========================================

    const formatHours = (hours) => {

        if (!hours) {
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


    // ==========================================
    // STATUS CLASS
    // ==========================================

    const getStatusClass = (itemStatus) => {

        switch (itemStatus) {

            case "Present":
                return "status-present";

            case "Late":
                return "status-late";

            case "Half Day":
                return "status-half";

            case "Absent":
                return "status-absent";

            default:
                return "";
        }
    };


    // ==========================================
    // SEARCH
    // ==========================================

    const handleSearch = (event) => {

        if (event.key === "Enter") {
            fetchAttendance();
        }
    };


    return (
        <div className="admin-attendance-page">

            {/* ==================================
                PAGE HEADER
            ================================== */}

            <div className="attendance-page-header">

                <div>
                    <h2>
                        Attendance Management
                    </h2>

                    <p>
                        Monitor employee attendance,
                        working hours and daily status.
                    </p>
                </div>

                <button
                    type="button"
                    className="attendance-refresh-btn"
                    onClick={fetchAttendance}
                    disabled={loading}
                >
                    <FaSyncAlt
                        className={
                            loading
                                ? "spin-icon"
                                : ""
                        }
                    />

                    Refresh
                </button>

            </div>


            {/* ==================================
                SUMMARY CARDS
            ================================== */}

            <div className="attendance-summary-grid">

                <div className="attendance-summary-card total">

                    <div className="summary-icon">
                        <FaUsers />
                    </div>

                    <div>
                        <span>
                            Total Employees
                        </span>

                        <strong>
                            {summary.totalEmployees}
                        </strong>
                    </div>

                </div>


                <div className="attendance-summary-card present">

                    <div className="summary-icon">
                        <FaUserCheck />
                    </div>

                    <div>
                        <span>
                            Present Today
                        </span>

                        <strong>
                            {summary.present}
                        </strong>
                    </div>

                </div>


                <div className="attendance-summary-card late">

                    <div className="summary-icon">
                        <FaUserClock />
                    </div>

                    <div>
                        <span>
                            Late Today
                        </span>

                        <strong>
                            {summary.late}
                        </strong>
                    </div>

                </div>


                <div className="attendance-summary-card absent">

                    <div className="summary-icon">
                        <FaUserTimes />
                    </div>

                    <div>
                        <span>
                            Absent Today
                        </span>

                        <strong>
                            {summary.absent}
                        </strong>
                    </div>

                </div>


                <div className="attendance-summary-card half">

                    <div className="summary-icon">
                        <FaUserClock />
                    </div>

                    <div>
                        <span>
                            Half Day
                        </span>

                        <strong>
                            {summary.halfDay}
                        </strong>
                    </div>

                </div>


                <div className="attendance-summary-card rate">

                    <div className="summary-icon">
                        %
                    </div>

                    <div>
                        <span>
                            Attendance Rate
                        </span>

                        <strong>
                            {summary.attendanceRate}%
                        </strong>
                    </div>

                </div>

            </div>


            {/* ==================================
                FILTERS
            ================================== */}

            <div className="attendance-filter-card">

                <div className="filter-group">

                    <label>
                        <FaCalendarAlt />
                        Date
                    </label>

                    <input
                        type="date"
                        value={date}
                        onChange={(event) =>
                            setDate(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="filter-group search-filter">

                    <label>
                        <FaSearch />
                        Employee
                    </label>

                    <div className="search-box">

                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search name or employee ID"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            onKeyDown={
                                handleSearch
                            }
                        />

                    </div>

                </div>


                <div className="filter-group">

                    <label>
                        Status
                    </label>

                    <select
                        value={status}
                        onChange={(event) =>
                            setStatus(
                                event.target.value
                            )
                        }
                    >

                        <option value="">
                            All Status
                        </option>

                        <option value="Present">
                            Present
                        </option>

                        <option value="Late">
                            Late
                        </option>

                        <option value="Half Day">
                            Half Day
                        </option>

                        <option value="Absent">
                            Absent
                        </option>

                    </select>

                </div>


                <button
                    type="button"
                    className="filter-search-btn"
                    onClick={fetchAttendance}
                    disabled={loading}
                >
                    <FaSearch />
                    Search
                </button>

            </div>


            {/* ==================================
                ERROR
            ================================== */}

            {error && (
                <div className="attendance-error">
                    {error}
                </div>
            )}


            {/* ==================================
                TABLE
            ================================== */}

            <div className="attendance-table-card">

                <div className="table-header">

                    <div>
                        <h3>
                            Daily Attendance
                        </h3>

                        <p>
                            {date}
                        </p>
                    </div>

                    <span>
                        {attendance.length} Records
                    </span>

                </div>


                <div className="attendance-table-wrapper">

                    {loading ? (

                        <div className="attendance-loading">

                            <div className="loading-spinner"></div>

                            <p>
                                Loading attendance...
                            </p>

                        </div>

                    ) : attendance.length === 0 ? (

                        <div className="attendance-empty">

                            <FaUsers />

                            <h4>
                                No Attendance Found
                            </h4>

                            <p>
                                No employee attendance
                                records match your filters.
                            </p>

                        </div>

                    ) : (

                        <table className="attendance-table">

                            <thead>

                                <tr>

                                    <th>
                                        Employee
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Check In
                                    </th>

                                    <th>
                                        Check Out
                                    </th>

                                    <th>
                                        Working Hours
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {attendance.map(
                                    (item) => (

                                        <tr
                                            key={
                                                item.employeeId
                                            }
                                        >

                                            <td>

                                                <div className="employee-cell">

                                                    <div className="employee-avatar">

                                                        {item.profileImage ? (

                                                            <img
                                                                src={
                                                                    `http://localhost:5000${item.profileImage}`
                                                                }
                                                                alt={
                                                                    item.name
                                                                }
                                                            />

                                                        ) : (

                                                            <span>
                                                                {item.name
                                                                    ?.charAt(
                                                                        0
                                                                    )
                                                                    ?.toUpperCase() ||
                                                                    "E"}
                                                            </span>

                                                        )}

                                                    </div>


                                                    <div>

                                                        <strong>
                                                            {item.name}
                                                        </strong>

                                                        <small>
                                                            {item.employeeId}
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>


                                            <td>
                                                {item.department ||
                                                    "--"}
                                            </td>


                                            <td>
                                                <span className="time-value">
                                                    {formatTime(
                                                        item.checkIn
                                                    )}
                                                </span>
                                            </td>


                                            <td>
                                                <span className="time-value">
                                                    {formatTime(
                                                        item.checkOut
                                                    )}
                                                </span>
                                            </td>


                                            <td>
                                                <strong>
                                                    {formatHours(
                                                        item.workingHours
                                                    )}
                                                </strong>
                                            </td>


                                            <td>

                                                <span
                                                    className={`attendance-status ${getStatusClass(
                                                        item.status
                                                    )}`}
                                                >
                                                    {item.status}
                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

            </div>

        </div>
    );
}

export default AdminAttendance;