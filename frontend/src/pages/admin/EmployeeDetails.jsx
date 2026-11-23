import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    FaArrowLeft,
    FaUserCircle,
    FaEdit,
    FaKey,
    FaCamera,
    FaPowerOff,
    FaTrash,
    FaCheckCircle,
    FaTimesCircle,
    FaEnvelope,
    FaBuilding,
    FaIdBadge,
    FaTimes,
    FaCheck,
    FaExclamationTriangle,
    FaImage
} from "react-icons/fa";

import API from "../../services/api";
import "./EmployeeDetails.css";


function EmployeeDetails() {

    const { id } = useParams();

    const navigate = useNavigate();


    // ======================================================
    // EMPLOYEE
    // ======================================================

    const [employee, setEmployee] =
        useState(null);

    const [loading, setLoading] =
        useState(true);


    // ======================================================
    // ACTION LOADING
    // ======================================================

    const [actionLoading, setActionLoading] =
        useState(false);


    // ======================================================
    // MODAL
    // ======================================================

    const [modal, setModal] = useState({
        open: false,
        type: "",
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


    const [selectedImage, setSelectedImage] =
        useState(null);

    const [imagePreview, setImagePreview] =
        useState("");


    // ======================================================
    // PASSWORD
    // ======================================================

    const [temporaryPassword, setTemporaryPassword] =
        useState("");


    // ======================================================
    // TOAST
    // ======================================================

    const [toast, setToast] = useState({
        show: false,
        type: "",
        title: "",
        message: ""
    });


    // ======================================================
    // ERROR MESSAGE
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
    // FETCH EMPLOYEE
    // ======================================================

    const fetchEmployee = async () => {

        try {

            setLoading(true);

            const response =
                await API.get(
                    `/employees/${id}`
                );


            const employeeData =
                response.data.employee ||
                response.data;


            setEmployee(employeeData);


            setEditForm({
                employeeId:
                    employeeData.employeeId || "",

                name:
                    employeeData.name || "",

                email:
                    employeeData.email || "",

                department:
                    employeeData.department || ""
            });


            setImagePreview(
                employeeData.profileImage
                    ? `http://localhost:5000${employeeData.profileImage}`
                    : ""
            );


        } catch (error) {

            console.error(
                "Employee details error:",
                error
            );


            showToast(
                "error",
                "Unable to Load",
                getErrorMessage(
                    error,
                    "Employee details load nahi ho paaye."
                )
            );


        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        fetchEmployee();

    }, [id]);


    // ======================================================
    // CLOSE MODAL
    // ======================================================

    const closeModal = () => {

        if (actionLoading) {
            return;
        }


        setModal({
            open: false,
            type: "",
            title: "",
            message: ""
        });


        setTemporaryPassword("");
    };


    // ======================================================
    // OPEN CONFIRM MODAL
    // ======================================================

    const openConfirmModal = (
        type,
        title,
        message
    ) => {

        setModal({
            open: true,
            type,
            title,
            message
        });
    };


    // ======================================================
    // EDIT
    // ======================================================

    const openEditModal = () => {

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
                ? `http://localhost:5000${employee.profileImage}`
                : ""
        );


        setModal({
            open: true,
            type: "edit",
            title: "Edit Employee",
            message: ""
        });
    };


    // ======================================================
    // IMAGE
    // ======================================================

    const handleImageChange = (event) => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


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
                    `/employees/admin/${employee._id}`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );


            const updatedEmployee =
                response.data.employee ||
                {
                    ...employee,
                    ...editForm
                };


            setEmployee(
                updatedEmployee
            );


            setEditForm({
                employeeId:
                    updatedEmployee.employeeId || "",

                name:
                    updatedEmployee.name || "",

                email:
                    updatedEmployee.email || "",

                department:
                    updatedEmployee.department || ""
            });


            setImagePreview(
                updatedEmployee.profileImage
                    ? `http://localhost:5000${updatedEmployee.profileImage}?t=${Date.now()}`
                    : ""
            );


            setSelectedImage(null);


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
    // STATUS
    // ======================================================

    const changeEmployeeStatus = async () => {

        try {

            setActionLoading(true);


            const newStatus =
                !employee.isActive;


            const response =
                await API.patch(
                    `/employees/admin/${employee._id}/status`,
                    {
                        isActive: newStatus
                    }
                );


            const updatedStatus =
                response.data.employee?.isActive ??
                newStatus;


            setEmployee((prev) => ({
                ...prev,
                isActive: updatedStatus
            }));


            closeModal();


            showToast(
                "success",
                updatedStatus
                    ? "Employee Activated"
                    : "Employee Deactivated",
                updatedStatus
                    ? `${employee.name} is now active.`
                    : `${employee.name} has been deactivated.`
            );


        } catch (error) {

            console.error(
                "Status update error:",
                error
            );


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

        try {

            setActionLoading(true);


            await API.delete(
                `/employees/admin/${employee._id}/face`
            );


            setEmployee((prev) => ({
                ...prev,
                faceEncodings: []
            }));


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

        try {

            setActionLoading(true);


            const response =
                await API.post(
                    `/employees/admin/${employee._id}/reset-password`
                );


            setTemporaryPassword(
                response.data.temporaryPassword
            );


            setModal({
                open: true,
                type: "password-result",
                title: "Password Reset Successfully",
                message: ""
            });


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
    // DELETE
    // ======================================================

    const deleteEmployee = async () => {

        try {

            setActionLoading(true);


            await API.delete(
                `/employees/admin/${employee._id}`
            );


            closeModal();


            showToast(
                "success",
                "Employee Deleted",
                `${employee.name} has been deleted successfully.`
            );


            setTimeout(() => {

                navigate("/employees");

            }, 900);


        } catch (error) {

            console.error(
                "Delete employee error:",
                error
            );


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
    // FACE CAPTURE
    // ======================================================

    const openFaceCapture = () => {

        navigate(
            `/face-capture/${employee.employeeId}`
        );
    };


    // ======================================================
    // CONFIRM ACTION
    // ======================================================

    const confirmAction = () => {

        if (
            modal.type ===
            "status"
        ) {

            changeEmployeeStatus();

            return;
        }


        if (
            modal.type ===
            "remove-face"
        ) {

            removeFace();

            return;
        }


        if (
            modal.type ===
            "reset-password"
        ) {

            resetPassword();

            return;
        }


        if (
            modal.type ===
            "delete"
        ) {

            deleteEmployee();

            return;
        }
    };


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (
            <div className="employee-details-page">

                <div className="employee-details-loading">

                    <div className="details-loader"></div>

                    <p>
                        Loading employee details...
                    </p>

                </div>

            </div>
        );
    }


    // ======================================================
    // NOT FOUND
    // ======================================================

    if (!employee) {

        return (
            <div className="employee-details-page">

                <div className="employee-details-not-found">

                    <FaExclamationTriangle />

                    <h2>
                        Employee Not Found
                    </h2>

                    <p>
                        Employee details could not be found.
                    </p>

                    <Link
                        to="/employees"
                        className="details-back-btn"
                    >
                        <FaArrowLeft />
                        Back to Employees
                    </Link>

                </div>

            </div>
        );
    }


    return (

        <div className="employee-details-page">


            {/* ==================================================
                TOAST
            ================================================== */}

            {toast.show && (

                <div
                    className={`employee-details-toast ${toast.type}`}
                >

                    <div>

                        <strong>
                            {toast.title}
                        </strong>

                        <span>
                            {toast.message}
                        </span>

                    </div>


                    <button
                        type="button"
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
                HEADER
            ================================================== */}

            <div className="employee-details-header">

                <Link
                    to="/employees"
                    className="details-back-btn"
                >
                    <FaArrowLeft />
                    Back to Employees
                </Link>


                <div className="details-header-text">

                    <span>
                        EMPLOYEE MANAGEMENT
                    </span>

                    <h2>
                        Employee Profile
                    </h2>

                    <p>
                        View employee information and manage account.
                    </p>

                </div>

            </div>


            {/* ==================================================
                PROFILE CARD
            ================================================== */}

            <div className="employee-profile-card">


                <div className="employee-profile-avatar">

                    {employee.profileImage ? (

                        <img
                            src={`http://localhost:5000${employee.profileImage}`}
                            alt={employee.name}
                        />

                    ) : (

                        <FaUserCircle />

                    )}

                </div>


                <div className="employee-profile-main">

                    <div className="employee-name-row">

                        <h1>
                            {employee.name}
                        </h1>


                        {employee.isActive !== false ? (

                            <span className="employee-status active">

                                <FaCheckCircle />

                                Active

                            </span>

                        ) : (

                            <span className="employee-status inactive">

                                <FaTimesCircle />

                                Inactive

                            </span>

                        )}

                    </div>


                    <p className="employee-profile-id">

                        <FaIdBadge />

                        {employee.employeeId}

                    </p>


                    <p className="employee-profile-department">

                        <FaBuilding />

                        {employee.department ||
                            "Department not specified"}

                    </p>

                </div>

            </div>


            {/* ==================================================
                INFORMATION
            ================================================== */}

            <div className="employee-details-card">

                <div className="details-card-heading">

                    <div>

                        <h3>
                            Employee Information
                        </h3>

                        <p>
                            Basic employee information
                        </p>

                    </div>

                </div>


                <div className="employee-info-grid">


                    <div className="employee-info-item">

                        <span>
                            <FaIdBadge />
                            Employee ID
                        </span>

                        <strong>
                            {employee.employeeId ||
                                "—"}
                        </strong>

                    </div>


                    <div className="employee-info-item">

                        <span>
                            <FaUserCircle />
                            Full Name
                        </span>

                        <strong>
                            {employee.name ||
                                "—"}
                        </strong>

                    </div>


                    <div className="employee-info-item">

                        <span>
                            <FaEnvelope />
                            Email
                        </span>

                        <strong>
                            {employee.email ||
                                "—"}
                        </strong>

                    </div>


                    <div className="employee-info-item">

                        <span>
                            <FaBuilding />
                            Department
                        </span>

                        <strong>
                            {employee.department ||
                                "—"}
                        </strong>

                    </div>


                    <div className="employee-info-item">

                        <span>
                            <FaCamera />
                            Face Recognition
                        </span>

                        <strong
                            className={
                                employee.faceEncodings?.length > 0
                                    ? "face-registered"
                                    : "face-pending"
                            }
                        >
                            {employee.faceEncodings?.length > 0
                                ? "Registered"
                                : "Not Registered"}
                        </strong>

                    </div>


                    <div className="employee-info-item">

                        <span>
                            Account Status
                        </span>

                        <strong
                            className={
                                employee.isActive !== false
                                    ? "account-active"
                                    : "account-inactive"
                            }
                        >
                            {employee.isActive !== false
                                ? "Active"
                                : "Inactive"}
                        </strong>

                    </div>

                </div>

            </div>


            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="employee-details-card">

                <div className="details-card-heading">

                    <div>

                        <h3>
                            Employee Actions
                        </h3>

                        <p>
                            Manage employee account
                        </p>

                    </div>

                </div>


                <div className="employee-action-grid">


                    {/* EDIT */}

                    <button
                        type="button"
                        className="employee-action-card edit"
                        onClick={
                            openEditModal
                        }
                    >

                        <div className="action-card-icon">
                            <FaEdit />
                        </div>

                        <div>

                            <strong>
                                Edit Profile
                            </strong>

                            <span>
                                Update employee information
                            </span>

                        </div>

                    </button>


                    {/* RESET PASSWORD */}

                    <button
                        type="button"
                        className="employee-action-card password"
                        onClick={() =>
                            openConfirmModal(
                                "reset-password",
                                "Reset Password?",
                                `A new temporary password will be generated for ${employee.name}.`
                            )
                        }
                    >

                        <div className="action-card-icon">
                            <FaKey />
                        </div>

                        <div>

                            <strong>
                                Reset Password
                            </strong>

                            <span>
                                Generate temporary password
                            </span>

                        </div>

                    </button>


                    {/* FACE */}

                    <button
                        type="button"
                        className="employee-action-card face"
                        onClick={
                            openFaceCapture
                        }
                    >

                        <div className="action-card-icon">
                            <FaCamera />
                        </div>

                        <div>

                            <strong>
                                {employee.faceEncodings?.length > 0
                                    ? "Update Face"
                                    : "Register Face"}
                            </strong>

                            <span>
                                Manage face recognition
                            </span>

                        </div>

                    </button>


                    {/* REMOVE FACE */}

                    {employee.faceEncodings?.length > 0 && (

                        <button
                            type="button"
                            className="employee-action-card remove-face"
                            onClick={() =>
                                openConfirmModal(
                                    "remove-face",
                                    "Remove Face Data?",
                                    `Are you sure you want to remove face data for ${employee.name}?`
                                )
                            }
                        >

                            <div className="action-card-icon">
                                <FaCamera />
                            </div>

                            <div>

                                <strong>
                                    Remove Face
                                </strong>

                                <span>
                                    Delete saved face data
                                </span>

                            </div>

                        </button>

                    )}


                    {/* STATUS */}

                    <button
                        type="button"
                        className="employee-action-card status"
                        onClick={() =>
                            openConfirmModal(
                                "status",
                                employee.isActive !== false
                                    ? "Deactivate Employee?"
                                    : "Activate Employee?",
                                employee.isActive !== false
                                    ? `Are you sure you want to deactivate ${employee.name}?`
                                    : `Are you sure you want to activate ${employee.name}?`
                            )
                        }
                    >

                        <div className="action-card-icon">
                            <FaPowerOff />
                        </div>

                        <div>

                            <strong>
                                {employee.isActive !== false
                                    ? "Deactivate Employee"
                                    : "Activate Employee"}
                            </strong>

                            <span>
                                {employee.isActive !== false
                                    ? "Disable employee login"
                                    : "Enable employee login"}
                            </span>

                        </div>

                    </button>

                </div>


                {/* DELETE */}

                <button
                    type="button"
                    className="employee-delete-btn"
                    onClick={() =>
                        openConfirmModal(
                            "delete",
                            "Delete Employee?",
                            `Are you sure you want to permanently delete ${employee.name} (${employee.employeeId})? Attendance records will be preserved.`
                        )
                    }
                >

                    <FaTrash />

                    Delete Employee

                </button>

            </div>


            {/* ==================================================
                MODAL
            ================================================== */}

            {modal.open && (

                <div
                    className="employee-details-modal-overlay"
                    onClick={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="employee-details-modal">


                        {/* MODAL HEADER */}

                        <div className="employee-details-modal-header">

                            <h3>
                                {modal.title}
                            </h3>

                            <button
                                type="button"
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                <FaTimes />
                            </button>

                        </div>


                        {/* MODAL BODY */}

                        <div className="employee-details-modal-body">


                            {/* ==================================================
                                EDIT
                            ================================================== */}

                            {modal.type === "edit" && (

                                <div className="employee-edit-form">


                                    <div className="profile-image-upload">

                                        <div className="profile-preview">

                                            {imagePreview ? (

                                                <img
                                                    src={
                                                        imagePreview
                                                    }
                                                    alt="Profile"
                                                />

                                            ) : (

                                                <FaUserCircle />

                                            )}

                                        </div>


                                        <label className="image-upload-btn">

                                            <FaImage />

                                            Choose Profile Image

                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={
                                                    handleImageChange
                                                }
                                            />

                                        </label>


                                        <small>
                                            JPG, PNG or WEBP • Max 5 MB
                                        </small>

                                    </div>


                                    <div className="details-form-grid">


                                        <div className="details-form-group">

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


                                        <div className="details-form-group">

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


                                        <div className="details-form-group">

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


                                        <div className="details-form-group">

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


                                    <div className="employee-modal-actions">

                                        <button
                                            type="button"
                                            className="details-modal-btn cancel"
                                            onClick={
                                                closeModal
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                        >
                                            Cancel
                                        </button>


                                        <button
                                            type="button"
                                            className="details-modal-btn primary"
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
                            )}


                            {/* ==================================================
                                PASSWORD RESULT
                            ================================================== */}

                            {modal.type ===
                                "password-result" && (

                                    <div className="password-result">

                                        <div className="password-success-icon">
                                            <FaCheck />
                                        </div>


                                        <h3>
                                            Temporary Password
                                        </h3>


                                        <p>
                                            Give this temporary password
                                            to the employee.
                                        </p>


                                        <div className="temporary-password-box">
                                            {temporaryPassword}
                                        </div>


                                        <div className="password-warning-text">

                                            Employee will be required
                                            to change this password
                                            after login.

                                        </div>


                                        <button
                                            type="button"
                                            className="details-modal-btn primary"
                                            onClick={
                                                closeModal
                                            }
                                        >
                                            Done
                                        </button>

                                    </div>
                                )}


                            {/* ==================================================
                                CONFIRMATION
                            ================================================== */}

                            {[
                                "status",
                                "remove-face",
                                "reset-password",
                                "delete"
                            ].includes(
                                modal.type
                            ) && (

                                    <div className="confirmation-content">


                                        <div className="confirmation-warning-icon">

                                            <FaExclamationTriangle />

                                        </div>


                                        <p>
                                            {modal.message}
                                        </p>


                                        <div className="employee-modal-actions">


                                            <button
                                                type="button"
                                                className="details-modal-btn cancel"
                                                onClick={
                                                    closeModal
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                            >
                                                Cancel
                                            </button>


                                            <button
                                                type="button"
                                                className={
                                                    modal.type ===
                                                        "delete"
                                                        ? "details-modal-btn danger"
                                                        : "details-modal-btn primary"
                                                }
                                                onClick={
                                                    confirmAction
                                                }
                                                disabled={
                                                    actionLoading
                                                }
                                            >

                                                {actionLoading
                                                    ? "Please wait..."
                                                    : modal.type === "delete"
                                                        ? "Delete"
                                                        : modal.type === "status"
                                                            ? employee.isActive !== false
                                                                ? "Deactivate"
                                                                : "Activate"
                                                            : modal.type === "remove-face"
                                                                ? "Remove Face"
                                                                : "Reset Password"}

                                            </button>

                                        </div>

                                    </div>
                                )}

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}


export default EmployeeDetails;