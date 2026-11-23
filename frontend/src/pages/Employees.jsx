import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import "./Employees.css";

import {
    FaUsers,
    FaSearch,
    FaSyncAlt,
    FaUserPlus,
    FaEdit,
    FaTrash,
    FaPowerOff,
    FaCamera,
    FaKey,
    FaTimes,
    FaCheck,
    FaExclamationTriangle,
    FaImage,
    FaUserCircle
} from "react-icons/fa";

function Employees() {

    // ======================================================
    // EMPLOYEE DATA
    // ======================================================

    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // ======================================================
    // MODAL
    // ======================================================

    const [modal, setModal] = useState({
        open: false,
        type: "",
        title: "",
        message: "",
        employee: null
    });

    // ======================================================
    // TOAST
    // ======================================================

    const [toast, setToast] = useState({
        show: false,
        type: "success",
        title: "",
        message: ""
    });

    // ======================================================
    // EDIT FORM
    // ======================================================

    const [editForm, setEditForm] = useState({
        employeeId: "",
        name: "",
        email: "",
        department: ""
    });

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const [actionLoading, setActionLoading] =
        useState(false);

    // ======================================================
    // RESET PASSWORD RESULT
    // ======================================================

    const [temporaryPassword, setTemporaryPassword] =
        useState("");

    // ======================================================
    // FETCH EMPLOYEES
    // ======================================================

    const fetchEmployees = async () => {

        try {

            setLoading(true);

            const response =
                await API.get("/employees");

            const data =
                Array.isArray(response.data)
                    ? response.data
                    : response.data.employees || [];

            setEmployees(data);

        } catch (error) {

            console.error(
                "Fetch employees error:",
                error
            );

            showToast(
                "error",
                "Unable to Load",
                getErrorMessage(
                    error,
                    "Employees load nahi ho paaye."
                )
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // ======================================================
    // ERROR MESSAGE HELPER
    // ======================================================

    const getErrorMessage = (
        error,
        fallback = "Something went wrong."
    ) => {

        return (
            error?.response?.data?.message ||
            error?.message ||
            fallback
        );
    };

    // ======================================================
    // TOAST
    // ======================================================

    const showToast = (
        type,
        title,
        message
    ) => {

        setToast({
            show: true,
            type,
            title,
            message
        });

        setTimeout(() => {

            setToast((prev) => ({
                ...prev,
                show: false
            }));

        }, 3500);
    };

    // ======================================================
    // CLOSE MODAL
    // ======================================================

    const closeModal = () => {

        if (actionLoading) return;

        setModal({
            open: false,
            type: "",
            title: "",
            message: "",
            employee: null
        });

        setTemporaryPassword("");
    };

    // ======================================================
    // OPEN CONFIRM MODAL
    // ======================================================

    const openConfirmModal = (
        type,
        title,
        message,
        employee
    ) => {

        setModal({
            open: true,
            type,
            title,
            message,
            employee
        });
    };

    // ======================================================
    // EDIT EMPLOYEE
    // ======================================================

    const openEditModal = (employee) => {

        setEditForm({
            employeeId:
                employee.employeeId || "",

            name:
                employee.name || "",

            email:
                employee.email || "",

            department:
                employee.department || ""
        });

        setSelectedImage(null);

        setImagePreview(
            employee.profileImage
                ? `${import.meta.env.VITE_API_BASE_URL}${employee.profileImage}`
                : ""
        );

        setModal({
            open: true,
            type: "edit",
            title: "Edit Employee",
            message: "",
            employee
        });
    };

    // ======================================================
    // IMAGE SELECT
    // ======================================================

    const handleImageChange = (event) => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            showToast(
                "error",
                "Invalid Image",
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            showToast(
                "error",
                "Image Too Large",
                "Profile image must be less than 5 MB."
            );

            return;
        }

        setSelectedImage(file);

        setImagePreview(
            URL.createObjectURL(file)
        );
    };

    // ======================================================
    // EDIT INPUT
    // ======================================================

    const handleEditChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setEditForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // ======================================================
    // UPDATE EMPLOYEE
    // ======================================================

    const updateEmployee = async () => {

        if (
            !editForm.employeeId.trim() ||
            !editForm.name.trim() ||
            !editForm.email.trim() ||
            !editForm.department.trim()
        ) {

            showToast(
                "error",
                "Missing Information",
                "Please fill all employee details."
            );

            return;
        }

        try {

            setActionLoading(true);

            const formData =
                new FormData();

            formData.append(
                "employeeId",
                editForm.employeeId.trim()
            );

            formData.append(
                "name",
                editForm.name.trim()
            );

            formData.append(
                "email",
                editForm.email.trim()
            );

            formData.append(
                "department",
                editForm.department.trim()
            );

            if (selectedImage) {

                formData.append(
                    "profileImage",
                    selectedImage
                );
            }

            const response =
                await API.put(
                    `/employees/admin/${modal.employee._id}`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );

            setEmployees((prev) =>
                prev.map((employee) =>
                    employee._id === modal.employee._id
                        ? {
                            ...employee,
                            ...response.data.employee
                        }
                        : employee
                )
            );

            closeModal();

            showToast(
                "success",
                "Employee Updated",
                "Employee details updated successfully."
            );

        } catch (error) {

            console.error(
                "Update employee error:",
                error
            );

            showToast(
                "error",
                "Update Failed",
                getErrorMessage(
                    error,
                    "Employee update nahi ho paaya."
                )
            );

        } finally {

            setActionLoading(false);
        }
    };

    // ======================================================
    // DELETE EMPLOYEE
    // ======================================================

    const deleteEmployee = async () => {

        const employee =
            modal.employee;

        try {

            setActionLoading(true);

            await API.delete(
                `/employees/admin/${employee._id}`
            );

            setEmployees((prev) =>
                prev.filter(
                    (item) =>
                        item._id !== employee._id
                )
            );

            closeModal();

            showToast(
                "success",
                "Employee Deleted",
                `${employee.name} has been deleted successfully.`
            );

        } catch (error) {

            console.error(
                "Delete employee error:",
                error
            );

            closeModal();

            showToast(
                "error",
                "Delete Failed",
                getErrorMessage(
                    error,
                    "Employee delete nahi ho paaya."
                )
            );

        } finally {

            setActionLoading(false);
        }
    };

    // ======================================================
    // CHANGE STATUS
    // ======================================================

    const changeEmployeeStatus = async () => {

        const employee =
            modal.employee;

        const newStatus =
            !employee.isActive;

        try {

            setActionLoading(true);

            const response =
                await API.patch(
                    `/employees/admin/${employee._id}/status`,
                    {
                        isActive: newStatus
                    }
                );

            setEmployees((prev) =>
                prev.map((item) =>
                    item._id === employee._id
                        ? {
                            ...item,
                            isActive:
                                response.data.employee.isActive
                        }
                        : item
                )
            );

            closeModal();

            showToast(
                "success",
                newStatus
                    ? "Employee Activated"
                    : "Employee Deactivated",
                newStatus
                    ? `${employee.name} is now active.`
                    : `${employee.name} has been deactivated.`
            );

        } catch (error) {

            console.error(
                "Status update error:",
                error
            );

            closeModal();

            showToast(
                "error",
                "Action Failed",
                getErrorMessage(
                    error,
                    "Employee status update nahi ho paaya."
                )
            );

        } finally {

            setActionLoading(false);
        }
    };

    // ======================================================
    // REMOVE FACE
    // ======================================================

    const removeFace = async () => {

        const employee =
            modal.employee;

        try {

            setActionLoading(true);

            await API.delete(
                `/employees/admin/${employee._id}/face`
            );

            setEmployees((prev) =>
                prev.map((item) =>
                    item._id === employee._id
                        ? {
                            ...item,
                            faceEncodings: []
                        }
                        : item
                )
            );

            closeModal();

            showToast(
                "success",
                "Face Removed",
                "Employee face data has been removed."
            );

        } catch (error) {

            console.error(
                "Remove face error:",
                error
            );

            closeModal();

            showToast(
                "error",
                "Remove Face Failed",
                getErrorMessage(
                    error,
                    "Face data remove nahi ho paaya."
                )
            );

        } finally {

            setActionLoading(false);
        }
    };

    // ======================================================
    // RESET PASSWORD
    // ======================================================

    const resetPassword = async () => {

        const employee =
            modal.employee;

        try {

            setActionLoading(true);

            const response =
                await API.post(
                    `/employees/admin/${employee._id}/reset-password`
                );

            setTemporaryPassword(
                response.data.temporaryPassword
            );

            setModal((prev) => ({
                ...prev,
                type: "password-result",
                title: "Password Reset Successfully"
            }));

        } catch (error) {

            console.error(
                "Reset password error:",
                error
            );

            closeModal();

            showToast(
                "error",
                "Password Reset Failed",
                getErrorMessage(
                    error,
                    "Password reset nahi ho paaya."
                )
            );

        } finally {

            setActionLoading(false);
        }
    };

    // ======================================================
    // FILTER
    // ======================================================

    const filteredEmployees =
        employees.filter((employee) => {

            const query =
                search.toLowerCase().trim();

            return (
                employee.name
                    ?.toLowerCase()
                    .includes(query) ||

                employee.employeeId
                    ?.toLowerCase()
                    .includes(query) ||

                employee.department
                    ?.toLowerCase()
                    .includes(query) ||

                employee.email
                    ?.toLowerCase()
                    .includes(query)
            );
        });

    // ======================================================
    // MODAL CONTENT
    // ======================================================

    const renderModalContent = () => {

        const employee =
            modal.employee;

        if (modal.type === "edit") {

            return (
                <div className="employee-edit-form">

                    <div className="profile-image-upload">

                        <div className="profile-preview">

                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Profile"
                                />
                            ) : (
                                <FaUserCircle />
                            )}

                        </div>

                        <label
                            className="image-upload-btn"
                        >
                            <FaImage />
                            Choose Profile Image

                            <input
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleImageChange
                                }
                            />

                        </label>

                        <small>
                            JPG, PNG or WEBP • Max 5 MB
                        </small>

                    </div>

                    <div className="form-grid">

                        <div className="form-group">

                            <label>
                                Employee ID
                            </label>

                            <input
                                name="employeeId"
                                value={
                                    editForm.employeeId
                                }
                                onChange={
                                    handleEditChange
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Name
                            </label>

                            <input
                                name="name"
                                value={
                                    editForm.name
                                }
                                onChange={
                                    handleEditChange
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={
                                    editForm.email
                                }
                                onChange={
                                    handleEditChange
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Department
                            </label>

                            <input
                                name="department"
                                value={
                                    editForm.department
                                }
                                onChange={
                                    handleEditChange
                                }
                            />

                        </div>

                    </div>

                    <div className="modal-actions">

                        <button
                            className="modal-btn cancel"
                            onClick={closeModal}
                            disabled={
                                actionLoading
                            }
                        >
                            Cancel
                        </button>

                        <button
                            className="modal-btn primary"
                            onClick={
                                updateEmployee
                            }
                            disabled={
                                actionLoading
                            }
                        >
                            <FaCheck />

                            {actionLoading
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                    </div>

                </div>
            );
        }

        if (modal.type === "password-result") {

            return (
                <div className="password-result">

                    <div className="success-icon">
                        <FaCheck />
                    </div>

                    <h3>
                        Temporary Password
                    </h3>

                    <p>
                        Give this temporary password
                        to the employee.
                    </p>

                    <div className="password-box">
                        {temporaryPassword}
                    </div>

                    <p className="password-warning">
                        Employee will be required to
                        change this password after login.
                    </p>

                    <div className="modal-actions">

                        <button
                            className="modal-btn primary"
                            onClick={closeModal}
                        >
                            Done
                        </button>

                    </div>

                </div>
            );
        }

        return (
            <div className="confirmation-content">

                <div className="warning-icon">
                    <FaExclamationTriangle />
                </div>

                <p>
                    {modal.message}
                </p>

                <div className="modal-actions">

                    <button
                        className="modal-btn cancel"
                        onClick={closeModal}
                        disabled={
                            actionLoading
                        }
                    >
                        Cancel
                    </button>

                    <button
                        className={`modal-btn ${modal.type === "delete"
                            ? "danger"
                            : "primary"
                            }`}
                        onClick={() => {

                            if (
                                modal.type ===
                                "delete"
                            ) {
                                deleteEmployee();
                            }

                            if (
                                modal.type ===
                                "status"
                            ) {
                                changeEmployeeStatus();
                            }

                            if (
                                modal.type ===
                                "remove-face"
                            ) {
                                removeFace();
                            }

                            if (
                                modal.type ===
                                "reset-password"
                            ) {
                                resetPassword();
                            }

                        }}
                        disabled={
                            actionLoading
                        }
                    >
                        {actionLoading
                            ? "Please wait..."
                            : modal.type === "delete"
                                ? "Delete"
                                : modal.type === "status"
                                    ? employee?.isActive
                                        ? "Deactivate"
                                        : "Activate"
                                    : modal.type ===
                                        "remove-face"
                                        ? "Remove Face"
                                        : "Reset Password"}
                    </button>

                </div>

            </div>
        );
    };

    return (
        <div className="dashboard-page">

            {/* ==================================================
                TOAST
            ================================================== */}

            {toast.show && (
                <div
                    className={`employee-toast ${toast.type}`}
                >

                    <div className="toast-icon">

                        {toast.type === "success"
                            ? <FaCheck />
                            : <FaTimes />}

                    </div>

                    <div className="toast-content">

                        <strong>
                            {toast.title}
                        </strong>

                        <span>
                            {toast.message}
                        </span>

                    </div>

                    <button
                        onClick={() =>
                            setToast((prev) => ({
                                ...prev,
                                show: false
                            }))
                        }
                    >
                        <FaTimes />
                    </button>

                </div>
            )}

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="page-heading">

                <div>

                    <h2>
                        Employee Management
                    </h2>

                    <p>
                        Manage and view all registered employees.
                    </p>

                </div>

                <div className="employee-heading-actions">

                    <button
                        className="refresh-btn"
                        onClick={fetchEmployees}
                        disabled={loading}
                    >
                        <FaSyncAlt />
                        Refresh
                    </button>

                    <Link
                        to="/admin/register-employee"
                        className="refresh-btn add-employee-link"
                    >
                        <FaUserPlus />
                        Add Employee
                    </Link>

                </div>

            </div>

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="employee-summary">

                <div className="stat-icon blue">
                    <FaUsers />
                </div>

                <div>

                    <p>
                        Total Employees
                    </p>

                    <h3>
                        {employees.length}
                    </h3>

                </div>

            </div>

            {/* ==================================================
                TABLE
            ================================================== */}

            <div className="employee-table-card">

                <div className="employee-toolbar">

                    <h4>
                        All Employees
                    </h4>

                    <div className="employee-search">

                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>

                {loading ? (

                    <div className="table-message">
                        Loading employees...
                    </div>

                ) : (

                    <div className="table-responsive">

                        <table className="table employee-table">

                            <thead>

                                <tr>

                                    <th>
                                        Profile
                                    </th>

                                    <th>
                                        Employee ID
                                    </th>

                                    <th>
                                        Name
                                    </th>

                                    <th>
                                        Email
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Face
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredEmployees.length > 0 ? (

                                    filteredEmployees.map(
                                        (employee) => (

                                            <tr
                                                key={
                                                    employee._id
                                                }
                                            >

                                                <td>

                                                    {employee.profileImage ? (

                                                        <img
                                                            className="employee-avatar"
                                                            src={`${import.meta.env.VITE_API_BASE_URL}${employee.profileImage}`}
                                                            alt={
                                                                employee.name
                                                            }
                                                        />

                                                    ) : (

                                                        <div className="employee-avatar-placeholder">
                                                            <FaUserCircle />
                                                        </div>

                                                    )}

                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            employee.employeeId
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        employee.name ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        employee.email ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        employee.department ||
                                                        "—"
                                                    }
                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            employee.isActive !== false
                                                                ? "status-badge active"
                                                                : "status-badge inactive"
                                                        }
                                                    >
                                                        {employee.isActive !== false
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>

                                                </td>

                                                <td>

                                                    <span
                                                        className={
                                                            employee.faceEncodings?.length > 0
                                                                ? "face-badge registered"
                                                                : "face-badge pending"
                                                        }
                                                    >
                                                        {employee.faceEncodings?.length > 0
                                                            ? "Registered"
                                                            : "Pending"}
                                                    </span>

                                                </td>

                                                <td>

                                                    <div className="employee-actions">

                                                        <Link
                                                            to={`/admin/employees/${employee._id}`}
                                                            className="employee-view-profile-btn"
                                                        >
                                                            View Profile
                                                        </Link>

                                                    </div>

                                                </td>

                                            </tr>

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="empty-table"
                                        >
                                            <FaUsers />

                                            <span>
                                                No employees found.
                                            </span>

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {/* ==================================================
                CUSTOM MODAL
            ================================================== */}

            {modal.open && (

                <div
                    className="employee-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget &&
                            !actionLoading
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="employee-modal">

                        <div className="modal-header">

                            <div>

                                <h3>
                                    {modal.title}
                                </h3>

                                {modal.type === "edit" &&
                                    modal.employee && (
                                        <span>
                                            Editing{" "}
                                            {
                                                modal.employee.employeeId
                                            }
                                        </span>
                                    )}

                            </div>

                            <button
                                className="modal-close"
                                onClick={closeModal}
                                disabled={
                                    actionLoading
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>

                        <div className="modal-body">

                            {renderModalContent()}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Employees;
