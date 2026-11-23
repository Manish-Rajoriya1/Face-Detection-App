import { useEffect, useState } from "react";
import employeeAPI from "../../services/employeeApi";
import "./LeaveRequest.css";

const LeaveRequest = () => {

    const [form, setForm] = useState({
        leaveType: "Casual Leave",
        fromDate: "",
        toDate: "",
        reason: "",
        message: ""
    });

    const [requests, setRequests] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingRequests, setLoadingRequests] =
        useState(true);

    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");


    // =====================================================
    // LOAD MY LEAVE REQUESTS
    // =====================================================

    const loadRequests = async () => {

        try {

            setLoadingRequests(true);

            const response =
                await employeeAPI.get("/leave/my");

            setRequests(
                response.data.requests || []
            );

        } catch (error) {

            console.error(
                "Load leave requests error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load leave requests."
            );

        } finally {

            setLoadingRequests(false);

        }

    };


    useEffect(() => {

        loadRequests();

    }, []);


    // =====================================================
    // HANDLE INPUT
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setError("");
        setSuccess("");

    };


    // =====================================================
    // SUBMIT LEAVE
    // =====================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setSuccess("");


        if (
            !form.fromDate ||
            !form.toDate ||
            !form.reason.trim()
        ) {

            setError(
                "Please fill all required fields."
            );

            return;
        }


        if (
            form.fromDate >
            form.toDate
        ) {

            setError(
                "From date cannot be after To date."
            );

            return;
        }


        try {

            setLoading(true);

            const response =
                await employeeAPI.post(
                    "/leave",
                    form
                );


            setSuccess(
                response.data.message ||
                "Leave request submitted successfully."
            );


            setForm({
                leaveType: "Casual Leave",
                fromDate: "",
                toDate: "",
                reason: "",
                message: ""
            });


            await loadRequests();


        } catch (error) {

            console.error(
                "Submit leave error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to submit leave request."
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // CANCEL REQUEST
    // =====================================================

    const handleCancel = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to cancel this leave request?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await employeeAPI.patch(
                `/leave/${id}/cancel`
            );

            await loadRequests();

            setSuccess(
                "Leave request cancelled successfully."
            );

        } catch (error) {

            console.error(
                "Cancel leave error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to cancel leave request."
            );

        }

    };


    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {

        if (status === "approved") {
            return "approved";
        }

        if (status === "rejected") {
            return "rejected";
        }

        if (status === "cancelled") {
            return "cancelled";
        }

        return "pending";

    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        const parts =
            date.split("-");

        if (parts.length !== 3) {
            return date;
        }

        return `${parts[2]}-${parts[1]}-${parts[0]}`;

    };


    return (
        <div className="employee-leave-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="employee-leave-header">

                <div>

                    <span className="employee-leave-eyebrow">
                        EMPLOYEE PORTAL
                    </span>

                    <h1>
                        Leave Request
                    </h1>

                    <p>
                        Submit a leave request to Admin
                        with your reason and required dates.
                    </p>

                </div>

                <div className="employee-leave-header-icon">
                    <i className="bi bi-calendar2-plus"></i>
                </div>

            </div>


            {/* =================================================
                ALERTS
            ================================================= */}

            {success && (
                <div className="employee-leave-alert success">
                    <i className="bi bi-check-circle-fill"></i>

                    <span>
                        {success}
                    </span>
                </div>
            )}


            {error && (
                <div className="employee-leave-alert error">
                    <i className="bi bi-exclamation-circle-fill"></i>

                    <span>
                        {error}
                    </span>
                </div>
            )}


            {/* =================================================
                REQUEST FORM
            ================================================= */}

            <div className="employee-leave-form-card">

                <div className="employee-leave-card-header">

                    <div>
                        <h3>
                            Apply for Leave
                        </h3>

                        <p>
                            Send your request directly
                            to the Admin.
                        </p>
                    </div>

                    <div className="employee-leave-card-icon">
                        <i className="bi bi-send"></i>
                    </div>

                </div>


                <form
                    onSubmit={handleSubmit}
                    className="employee-leave-form"
                >

                    {/* LEAVE TYPE */}

                    <div className="employee-leave-field">

                        <label>
                            Leave Type
                        </label>

                        <select
                            name="leaveType"
                            value={form.leaveType}
                            onChange={handleChange}
                        >

                            <option>
                                Casual Leave
                            </option>

                            <option>
                                Sick Leave
                            </option>

                            <option>
                                Emergency Leave
                            </option>

                            <option>
                                Other
                            </option>

                        </select>

                    </div>


                    {/* FROM DATE */}

                    <div className="employee-leave-field">

                        <label>
                            From Date
                        </label>

                        <input
                            type="date"
                            name="fromDate"
                            value={form.fromDate}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    {/* TO DATE */}

                    <div className="employee-leave-field">

                        <label>
                            To Date
                        </label>

                        <input
                            type="date"
                            name="toDate"
                            value={form.toDate}
                            onChange={handleChange}
                            required
                        />

                    </div>


                    {/* REASON */}

                    <div className="employee-leave-field full">

                        <label>
                            Reason
                            <span>*</span>
                        </label>

                        <input
                            type="text"
                            name="reason"
                            value={form.reason}
                            onChange={handleChange}
                            placeholder="Enter reason for leave"
                            maxLength={200}
                            required
                        />

                    </div>


                    {/* MESSAGE */}

                    <div className="employee-leave-field full">

                        <label>
                            Additional Message
                            <small>
                                Optional
                            </small>
                        </label>

                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="Write any additional information for Admin..."
                            rows="4"
                            maxLength={500}
                        />

                    </div>


                    {/* SUBMIT */}

                    <div className="employee-leave-form-actions">

                        <button
                            type="submit"
                            className="employee-leave-submit"
                            disabled={loading}
                        >

                            <i className="bi bi-send-fill"></i>

                            {loading
                                ? "Sending..."
                                : "Send Leave Request"}

                        </button>

                    </div>

                </form>

            </div>


            {/* =================================================
                MY REQUEST HISTORY
            ================================================= */}

            <div className="employee-leave-history-card">

                <div className="employee-leave-card-header">

                    <div>

                        <h3>
                            My Leave Requests
                        </h3>

                        <p>
                            Track the status of your
                            submitted requests.
                        </p>

                    </div>

                    <div className="employee-leave-card-icon">
                        <i className="bi bi-clock-history"></i>
                    </div>

                </div>


                {loadingRequests ? (

                    <div className="employee-leave-loading">
                        <i className="bi bi-arrow-repeat"></i>
                        Loading requests...
                    </div>

                ) : requests.length === 0 ? (

                    <div className="employee-leave-empty">

                        <div>
                            <i className="bi bi-calendar-x"></i>
                        </div>

                        <h4>
                            No Leave Requests
                        </h4>

                        <p>
                            You have not submitted
                            any leave requests yet.
                        </p>

                    </div>

                ) : (

                    <div className="employee-leave-table-wrapper">

                        <table className="employee-leave-table">

                            <thead>

                                <tr>

                                    <th>
                                        Leave Type
                                    </th>

                                    <th>
                                        From
                                    </th>

                                    <th>
                                        To
                                    </th>

                                    <th>
                                        Reason
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {requests.map(
                                    (request) => (

                                        <tr
                                            key={
                                                request._id
                                            }
                                        >

                                            <td>
                                                <strong>
                                                    {
                                                        request.leaveType
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        request.fromDate
                                                    )
                                                }
                                            </td>

                                            <td>
                                                {
                                                    formatDate(
                                                        request.toDate
                                                    )
                                                }
                                            </td>

                                            <td>
                                                <span className="employee-leave-reason">
                                                    {
                                                        request.reason
                                                    }
                                                </span>
                                            </td>

                                            <td>

                                                <span
                                                    className={`employee-leave-status ${getStatusClass(
                                                        request.status
                                                    )}`}
                                                >
                                                    {
                                                        request.status
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                {request.status ===
                                                    "pending" && (

                                                        <button
                                                            type="button"
                                                            className="employee-leave-cancel"
                                                            onClick={() =>
                                                                handleCancel(
                                                                    request._id
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </button>

                                                    )}

                                                {request.status ===
                                                    "rejected" &&
                                                    request.adminReason && (

                                                        <span className="employee-leave-admin-reason">
                                                            {
                                                                request.adminReason
                                                            }
                                                        </span>

                                                    )}

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
};

export default LeaveRequest;