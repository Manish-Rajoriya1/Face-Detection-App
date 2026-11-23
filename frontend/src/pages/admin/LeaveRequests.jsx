import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";


import {
    FaCalendarAlt,
    FaCheck,
    FaTimes,
    FaEye,
    FaSyncAlt,
    FaSearch,
    FaUser,
    FaTrash
} from "react-icons/fa";

import API from "../../services/api";
import "./LeaveRequests.css";

function LeaveRequests() {

    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [selectedRequest, setSelectedRequest] =
        useState(null);

    const [showDetails, setShowDetails] =
        useState(false);

    const [showRejectModal, setShowRejectModal] =
        useState(false);

    const [showApproveModal, setShowApproveModal] =
        useState(false);

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [adminReason, setAdminReason] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");


    // =====================================================
    // LOAD LEAVE REQUESTS
    // =====================================================

    const loadRequests = async (
        showRefresh = false
    ) => {

        try {

            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response =
                await API.get("/leave/admin");

            setRequests(
                response.data.requests || []
            );

        } catch (error) {

            console.error(
                "Leave requests loading error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to load leave requests."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);

        }

    };


    useEffect(() => {

        loadRequests();

    }, []);


    // =====================================================
    // FILTER
    // =====================================================

    const filteredRequests =
        requests.filter((request) => {

            const searchText =
                search.toLowerCase().trim();

            const matchesSearch =
                !searchText ||
                request.employeeName
                    ?.toLowerCase()
                    .includes(searchText) ||
                request.employeeId
                    ?.toLowerCase()
                    .includes(searchText) ||
                request.leaveType
                    ?.toLowerCase()
                    .includes(searchText);

            const matchesStatus =
                statusFilter === "all" ||
                request.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );

        });


    // =====================================================
    // COUNTS
    // =====================================================

    const pendingCount =
        requests.filter(
            (item) =>
                item.status === "pending"
        ).length;

    const approvedCount =
        requests.filter(
            (item) =>
                item.status === "approved"
        ).length;

    const rejectedCount =
        requests.filter(
            (item) =>
                item.status === "rejected"
        ).length;


    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return new Date(
            `${date}T00:00:00`
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    // =====================================================
    // VIEW REQUEST
    // =====================================================

    const handleView = (request) => {

        setSelectedRequest(request);
        setShowDetails(true);

    };

    // =====================================================
    // OPEN EMPLOYEE PROFILE
    // =====================================================

    const handleEmployeeProfile = (request) => {

        const employeeId =
            request.employee?._id ||
            request.employee;

        if (!employeeId) {

            setMessage(
                "Employee profile is not available."
            );

            return;
        }

        navigate(
            `/employees/${employeeId}`
        );

    };

    // =====================================================
    // APPROVE
    // =====================================================

    const handleApprove = async () => {

        if (!selectedRequest) {
            return;
        }

        try {

            setActionLoading(true);
            setMessage("");

            const response =
                await API.patch(
                    `/leave/admin/${selectedRequest._id}/approve`,
                    {}
                );

            setMessage(
                response.data.message ||
                "Leave request approved successfully."
            );

            setShowApproveModal(false);
            setShowDetails(false);
            setSelectedRequest(null);

            await loadRequests();

        } catch (error) {

            console.error(
                "Approve leave error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to approve leave request."
            );

        } finally {

            setActionLoading(false);

        }
    };


    // =====================================================
    // OPEN REJECT MODAL
    // =====================================================

    const openRejectModal = () => {

        setAdminReason("");
        setShowRejectModal(true);

    };


    // =====================================================
    // REJECT
    // =====================================================

    const handleReject = async () => {

        if (!selectedRequest) {
            return;
        }

        if (!adminReason.trim()) {

            setMessage(
                "Please enter a reason for rejection."
            );

            return;

        }

        try {

            setActionLoading(true);

            const response =
                await API.patch(
                    `/leave/admin/${selectedRequest._id}/reject`,
                    {
                        adminReason:
                            adminReason.trim()
                    }
                );

            setMessage(
                response.data.message ||
                "Leave request rejected."
            );

            setShowRejectModal(false);
            setShowDetails(false);
            setSelectedRequest(null);
            setAdminReason("");

            await loadRequests();

        } catch (error) {

            console.error(
                "Reject leave error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to reject leave request."
            );

        } finally {

            setActionLoading(false);

        }

    };


    // =====================================================
    // OPEN DELETE MODAL
    // =====================================================

    const openDeleteModal = () => {

        if (!selectedRequest) {
            return;
        }

        setShowDeleteModal(true);

    };


    // =====================================================
    // DELETE LEAVE REQUEST
    // =====================================================

    const handleDelete = async () => {

        if (!selectedRequest) {
            return;
        }

        try {

            setActionLoading(true);
            setMessage("");

            const response =
                await API.delete(
                    `/leave/admin/${selectedRequest._id}`
                );

            setShowDeleteModal(false);
            setShowDetails(false);
            setSelectedRequest(null);

            setMessage(
                response.data.message ||
                "Leave request deleted successfully."
            );

            await loadRequests();

        } catch (error) {

            console.error(
                "Delete leave error:",
                error
            );

            setShowDeleteModal(false);

            setMessage(
                error.response?.data?.message ||
                "Unable to delete leave request."
            );

        } finally {

            setActionLoading(false);

        }

    };


    // =====================================================
    // CLOSE DETAILS
    // =====================================================

    const closeDetails = () => {

        if (actionLoading) {
            return;
        }

        setShowDetails(false);
        setSelectedRequest(null);

    };


    return (
        <div className="leave-requests-page">


            {/* =================================================
                        HEADER
            ================================================= */}

            <div className="leave-page-header">

                <div>

                    <span className="leave-page-eyebrow">
                        ADMIN / LEAVE MANAGEMENT
                    </span>

                    <h1>
                        Leave Requests
                    </h1>

                    <p>
                        Review and manage employee
                        leave requests.
                    </p>

                </div>


                <button
                    type="button"
                    className="leave-refresh-btn"
                    onClick={() =>
                        loadRequests(true)
                    }
                    disabled={refreshing}
                >

                    <FaSyncAlt
                        className={
                            refreshing
                                ? "leave-spin"
                                : ""
                        }
                    />

                    Refresh

                </button>

            </div>


            {/* =================================================
                        MESSAGE
            ================================================= */}

            {message && (

                <div className="leave-message">

                    <span>
                        {message}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setMessage("")
                        }
                    >
                        <FaTimes />
                    </button>

                </div>

            )}


            {/* =================================================
                        SUMMARY
            ================================================= */}

            <div className="leave-summary-grid">

                <div className="leave-summary-card">

                    <div className="leave-summary-icon total">
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <span>
                            Total Requests
                        </span>

                        <strong>
                            {requests.length}
                        </strong>
                    </div>

                </div>


                <div className="leave-summary-card">

                    <div className="leave-summary-icon pending">
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <span>
                            Pending
                        </span>

                        <strong>
                            {pendingCount}
                        </strong>
                    </div>

                </div>


                <div className="leave-summary-card">

                    <div className="leave-summary-icon approved">
                        <FaCheck />
                    </div>

                    <div>
                        <span>
                            Approved
                        </span>

                        <strong>
                            {approvedCount}
                        </strong>
                    </div>

                </div>


                <div className="leave-summary-card">

                    <div className="leave-summary-icon rejected">
                        <FaTimes />
                    </div>

                    <div>
                        <span>
                            Rejected
                        </span>

                        <strong>
                            {rejectedCount}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =================================================
                        FILTERS
            ================================================= */}

            <div className="leave-filter-card">

                <div className="leave-search">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Search employee, ID or leave type..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                <select
                    value={statusFilter}
                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }
                >

                    <option value="all">
                        All Status
                    </option>

                    <option value="pending">
                        Pending
                    </option>

                    <option value="approved">
                        Approved
                    </option>

                    <option value="rejected">
                        Rejected
                    </option>

                    <option value="cancelled">
                        Cancelled
                    </option>

                </select>

            </div>


            {/* =================================================
                        TABLE
            ================================================= */}

            <div className="leave-table-card">

                <div className="leave-table-header">

                    <div>

                        <h2>
                            Leave Requests
                        </h2>

                        <span>
                            {filteredRequests.length}
                            {" "}request(s)
                        </span>

                    </div>

                </div>


                {loading ? (

                    <div className="leave-loading">

                        <div className="leave-loading-spinner"></div>

                        <span>
                            Loading leave requests...
                        </span>

                    </div>

                ) : filteredRequests.length === 0 ? (

                    <div className="leave-empty">

                        <FaCalendarAlt />

                        <h3>
                            No leave requests found
                        </h3>

                        <p>
                            There are no requests
                            matching your filters.
                        </p>

                    </div>

                ) : (

                    <div className="leave-table-wrapper">

                        <table>

                            <thead>

                                <tr>

                                    <th>
                                        Employee
                                    </th>

                                    <th>
                                        Leave Type
                                    </th>

                                    <th>
                                        Duration
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

                                {filteredRequests.map(
                                    (request) => (

                                        <tr
                                            key={
                                                request._id
                                            }
                                        >

                                            <td>
                                                <button
                                                    type="button"
                                                    className="leave-employee-link"
                                                    onClick={() =>
                                                        handleEmployeeProfile(request)
                                                    }
                                                >

                                                    <div className="leave-employee-avatar">

                                                        {request.employee?.profileImage ? (

                                                            <img
                                                                src={
                                                                    `http://localhost:5000${request.employee.profileImage}`
                                                                }
                                                                alt={
                                                                    request.employeeName ||
                                                                    "Employee"
                                                                }
                                                            />

                                                        ) : (

                                                            <FaUser />

                                                        )}

                                                    </div>


                                                    <div>

                                                        <strong>
                                                            {
                                                                request.employeeName
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                request.employeeId
                                                            }
                                                        </span>

                                                    </div>

                                                </button>

                                            </td>


                                            <td>

                                                <span className="leave-type">
                                                    {
                                                        request.leaveType
                                                    }
                                                </span>

                                            </td>


                                            <td>

                                                <div className="leave-duration">

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                request.fromDate
                                                            )
                                                        }
                                                    </strong>

                                                    <span>
                                                        to
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                request.toDate
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                            </td>


                                            <td>

                                                <span className="leave-reason">
                                                    {
                                                        request.reason
                                                    }
                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={`leave-status ${request.status}`}
                                                >
                                                    {request.status}
                                                </span>

                                            </td>


                                            <td>

                                                <button
                                                    type="button"
                                                    className="leave-view-btn"
                                                    onClick={() =>
                                                        handleView(
                                                            request
                                                        )
                                                    }
                                                >

                                                    <FaEye />

                                                    View

                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                    REQUEST DETAILS MODAL
            ================================================= */}

            {showDetails &&
                selectedRequest && (

                    <div
                        className="leave-modal-overlay"
                        onClick={
                            closeDetails
                        }
                    >

                        <div
                            className="leave-modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <button
                                type="button"
                                className="leave-modal-close"
                                onClick={
                                    closeDetails
                                }
                            >
                                <FaTimes />
                            </button>


                            <div className="leave-modal-icon">
                                <FaCalendarAlt />
                            </div>


                            <h2>
                                Leave Request
                            </h2>

                            <p className="leave-modal-subtitle">
                                Review employee leave
                                request details.
                            </p>


                            <div className="leave-detail-grid">

                                <div>
                                    <span>
                                        Employee
                                    </span>

                                    <strong>
                                        {
                                            selectedRequest.employeeName
                                        }
                                    </strong>

                                    <button
                                        type="button"
                                        className="leave-profile-link-btn"
                                        onClick={() =>
                                            handleEmployeeProfile(
                                                selectedRequest
                                            )
                                        }
                                    >
                                        View Employee Profile
                                    </button>
                                </div>


                                <div>
                                    <span>
                                        Employee ID
                                    </span>

                                    <strong>
                                        {
                                            selectedRequest.employeeId
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Leave Type
                                    </span>

                                    <strong>
                                        {
                                            selectedRequest.leaveType
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        From Date
                                    </span>

                                    <strong>
                                        {
                                            formatDate(
                                                selectedRequest.fromDate
                                            )
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        To Date
                                    </span>

                                    <strong>
                                        {
                                            formatDate(
                                                selectedRequest.toDate
                                            )
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Status
                                    </span>

                                    <strong
                                        className={`leave-modal-status ${selectedRequest.status}`}
                                    >
                                        {
                                            selectedRequest.status
                                        }
                                    </strong>
                                </div>

                            </div>


                            <div className="leave-detail-box">

                                <span>
                                    Reason
                                </span>

                                <p>
                                    {
                                        selectedRequest.reason
                                    }
                                </p>

                            </div>


                            {selectedRequest.message && (

                                <div className="leave-detail-box">

                                    <span>
                                        Employee Message
                                    </span>

                                    <p>
                                        {
                                            selectedRequest.message
                                        }
                                    </p>

                                </div>

                            )}


                            {selectedRequest.adminReason && (

                                <div className="leave-detail-box">

                                    <span>
                                        Admin Response
                                    </span>

                                    <p>
                                        {
                                            selectedRequest.adminReason
                                        }
                                    </p>

                                </div>

                            )}


                            <div className="leave-modal-actions">

                                {selectedRequest.status ===
                                    "pending" && (

                                        <>

                                            <button
                                                type="button"
                                                className="leave-reject-btn"
                                                onClick={
                                                    openRejectModal
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                            >
                                                <FaTimes />

                                                Reject

                                            </button>


                                            <button
                                                type="button"
                                                className="leave-approve-btn"
                                                onClick={() =>
                                                    setShowApproveModal(true)
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                            >
                                                <FaCheck />

                                                Approve

                                            </button>

                                        </>

                                    )}


                                <button
                                    type="button"
                                    className="leave-delete-btn"
                                    onClick={openDeleteModal}
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    <FaTrash />

                                    Delete

                                </button>

                            </div>

                        </div>

                    </div>

                )}

            {/* =================================================
                    DELETE CONFIRMATION MODAL
            ================================================= */}

            {showDeleteModal && selectedRequest && (

                <div
                    className="leave-modal-overlay"
                    onClick={() => {

                        if (!actionLoading) {
                            setShowDeleteModal(false);
                        }

                    }}
                >

                    <div
                        className="leave-delete-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="leave-modal-close"
                            onClick={() => {

                                if (!actionLoading) {
                                    setShowDeleteModal(false);
                                }

                            }}
                            disabled={actionLoading}
                        >
                            <FaTimes />
                        </button>


                        <div className="leave-delete-icon">
                            <FaTrash />
                        </div>


                        <h2>
                            Delete Leave Request?
                        </h2>


                        <p>
                            Are you sure you want to permanently
                            delete the leave request from{" "}
                            <strong>
                                {selectedRequest.employeeName}
                            </strong>
                            ?
                        </p>


                        <span className="leave-delete-warning">
                            This action cannot be undone.
                        </span>


                        <div className="leave-modal-actions">

                            <button
                                type="button"
                                className="leave-cancel-btn"
                                onClick={() =>
                                    setShowDeleteModal(false)
                                }
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="leave-delete-confirm-btn"
                                onClick={handleDelete}
                                disabled={actionLoading}
                            >
                                <FaTrash />

                                {actionLoading
                                    ? "Deleting..."
                                    : "Yes, Delete"}

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
        APPROVE CONFIRMATION MODAL
================================================= */}

            {showApproveModal && selectedRequest && (

                <div
                    className="leave-modal-overlay"
                    onClick={() => {

                        if (!actionLoading) {
                            setShowApproveModal(false);
                        }

                    }}
                >

                    <div
                        className="leave-approve-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* CLOSE */}

                        <button
                            type="button"
                            className="leave-modal-close"
                            onClick={() => {

                                if (!actionLoading) {
                                    setShowApproveModal(false);
                                }

                            }}
                        >
                            <FaTimes />
                        </button>


                        {/* ICON */}

                        <div className="leave-approve-icon">
                            <FaCheck />
                        </div>


                        {/* TITLE */}

                        <h2>
                            Approve Leave Request
                        </h2>


                        {/* MESSAGE */}

                        <p>
                            Are you sure you want to approve
                            the leave request from{" "}
                            <strong>
                                {selectedRequest.employeeName}
                            </strong>
                            ?
                        </p>


                        {/* LEAVE INFO */}

                        <div className="leave-approve-info">

                            <div>
                                <span>
                                    Leave Type
                                </span>

                                <strong>
                                    {selectedRequest.leaveType}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Duration
                                </span>

                                <strong>
                                    {formatDate(
                                        selectedRequest.fromDate
                                    )}
                                    {" "}to{" "}
                                    {formatDate(
                                        selectedRequest.toDate
                                    )}
                                </strong>
                            </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="leave-modal-actions">

                            <button
                                type="button"
                                className="leave-cancel-btn"
                                onClick={() =>
                                    setShowApproveModal(false)
                                }
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="leave-approve-confirm-btn"
                                onClick={handleApprove}
                                disabled={actionLoading}
                            >

                                <FaCheck />

                                {actionLoading
                                    ? "Approving..."
                                    : "Yes, Approve"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* =================================================
                    REJECT REASON MODAL
            ================================================= */}

            {showRejectModal && (

                <div
                    className="leave-modal-overlay"
                    onClick={() => {

                        if (!actionLoading) {
                            setShowRejectModal(
                                false
                            );
                        }

                    }}
                >

                    <div
                        className="leave-reject-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="leave-modal-close"
                            onClick={() => {

                                if (!actionLoading) {
                                    setShowRejectModal(
                                        false
                                    );
                                }

                            }}
                        >
                            <FaTimes />
                        </button>


                        <div className="leave-reject-icon">
                            <FaTimes />
                        </div>


                        <h2>
                            Reject Leave Request
                        </h2>

                        <p>
                            Please provide a reason
                            for rejecting this request.
                        </p>


                        <textarea
                            value={adminReason}
                            onChange={(e) =>
                                setAdminReason(
                                    e.target.value
                                )
                            }
                            placeholder="Enter rejection reason..."
                            rows="4"
                            disabled={
                                actionLoading
                            }
                        />


                        <div className="leave-modal-actions">

                            <button
                                type="button"
                                className="leave-cancel-btn"
                                onClick={() =>
                                    setShowRejectModal(
                                        false
                                    )
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="leave-reject-confirm-btn"
                                onClick={
                                    handleReject
                                }
                                disabled={
                                    actionLoading
                                }
                            >

                                <FaTimes />

                                {actionLoading
                                    ? "Rejecting..."
                                    : "Reject Request"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default LeaveRequests;