import { useEffect, useRef, useState } from "react";
import "./EmployeeProfile.css";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

const EmployeeProfile = () => {

    /* =====================================================
       EMPLOYEE DATA
    ===================================================== */

    const [employee, setEmployee] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("employeeUser") || "{}"
            );
        } catch (error) {
            console.error(
                "Employee data error:",
                error
            );

            return {};
        }
    });


    /* =====================================================
       PROFILE IMAGE
    ===================================================== */

    const [imagePreview, setImagePreview] = useState(() => {

        try {

            const savedEmployee =
                JSON.parse(
                    localStorage.getItem(
                        "employeeUser"
                    ) || "{}"
                );

            if (
                savedEmployee.profileImage
            ) {
                return `${BACKEND_URL}${savedEmployee.profileImage}`;
            }

            return null;

        } catch (error) {

            return null;

        }

    });


    /* =====================================================
       STATES
    ===================================================== */

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [uploading, setUploading] =
        useState(false);

    const [loadingProfile, setLoadingProfile] =
        useState(true);

    const [success, setSuccess] =
        useState("");

    const [error, setError] =
        useState("");


    const fileInputRef =
        useRef(null);


    /* =====================================================
       LOGOUT EMPLOYEE
    ===================================================== */

    const logoutEmployee = () => {

        localStorage.removeItem(
            "employeeToken"
        );

        localStorage.removeItem(
            "employeeUser"
        );

        localStorage.removeItem(
            "mustChangePassword"
        );

        window.location.replace("/employee-login");
    };


    /* =====================================================
       LOAD LATEST EMPLOYEE DATA
    ===================================================== */

    useEffect(() => {

        const loadLatestEmployee = async () => {

            try {

                const token =
                    localStorage.getItem(
                        "employeeToken"
                    );

                if (!token) {

                    logoutEmployee();

                    return;
                }


                const response =
                    await fetch(
                        `${BACKEND_URL}/api/employees/employee/me`,
                        {
                            method: "GET",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json();


                /* =========================================
                   EMPLOYEE DEACTIVATED
                ========================================= */

                if (
                    response.status === 403 &&
                    data.code ===
                    "EMPLOYEE_DEACTIVATED"
                ) {

                    logoutEmployee();

                    return;
                }


                /* =========================================
                   OTHER ERROR
                ========================================= */

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load employee profile."
                    );
                }


                /* =========================================
                   UPDATE EMPLOYEE DATA
                ========================================= */

                if (data.employee) {

                    setEmployee(
                        data.employee
                    );


                    localStorage.setItem(
                        "employeeUser",
                        JSON.stringify(
                            data.employee
                        )
                    );


                    /* =====================================
                       UPDATE PROFILE IMAGE
                    ===================================== */

                    if (
                        data.employee.profileImage
                    ) {

                        setImagePreview(
                            `${BACKEND_URL}${data.employee.profileImage}?t=${Date.now()}`
                        );

                    } else {

                        setImagePreview(null);

                    }

                }

            } catch (error) {

                console.error(
                    "Load employee profile error:",
                    error
                );

                setError(
                    error.message ||
                    "Unable to load employee profile."
                );

            } finally {

                setLoadingProfile(false);

            }

        };


        loadLatestEmployee();

    }, []);


    /* =====================================================
       EMPLOYEE INITIAL
    ===================================================== */

    const getInitial = () => {

        return (
            employee.name ||
            "E"
        )
            .charAt(0)
            .toUpperCase();

    };


    /* =====================================================
       SELECT IMAGE
    ===================================================== */

    const handleImageSelect = (event) => {

        const file =
            event.target.files?.[0];


        setError("");
        setSuccess("");


        if (!file) {
            return;
        }


        /* Allowed image types */

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            setError(
                "Only JPG, PNG and WEBP images are allowed."
            );

            event.target.value = "";

            return;
        }


        /* Maximum 2 MB */

        if (
            file.size >
            2 * 1024 * 1024
        ) {

            setError(
                "Image size must be less than 2 MB."
            );

            event.target.value = "";

            return;
        }


        setSelectedFile(file);


        /* Create preview */

        const previewURL =
            URL.createObjectURL(file);


        setImagePreview(
            previewURL
        );

    };


    /* =====================================================
       UPLOAD IMAGE
    ===================================================== */

    const handleUploadImage = async () => {

        setError("");
        setSuccess("");


        if (!selectedFile) {

            setError(
                "Please select a profile image."
            );

            return;
        }


        try {

            setUploading(true);


            /* Get employee token */

            const token =
                localStorage.getItem(
                    "employeeToken"
                );


            if (!token) {

                logoutEmployee();

                return;
            }


            /* =================================================
               FORM DATA
            ================================================= */

            const formData =
                new FormData();


            formData.append(
                "profileImage",
                selectedFile
            );


            /* =================================================
               API REQUEST
            ================================================= */

            const response =
                await fetch(
                    `${BACKEND_URL}/api/employees/employee/profile-image`,
                    {
                        method: "PUT",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },

                        body: formData
                    }
                );


            const data =
                await response.json();


            /* =================================================
               EMPLOYEE DEACTIVATED
            ================================================= */

            if (
                response.status === 403 &&
                data.code ===
                "EMPLOYEE_DEACTIVATED"
            ) {

                logoutEmployee();

                return;
            }


            /* =================================================
               ERROR RESPONSE
            ================================================= */

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Profile image upload failed."
                );

            }


            /* =================================================
               UPDATE EMPLOYEE DATA
            ================================================= */

            const updatedEmployee = {
                ...employee,
                ...data.employee
            };


            /* Save localStorage */

            localStorage.setItem(
                "employeeUser",
                JSON.stringify(
                    updatedEmployee
                )
            );


            /* Update React state */

            setEmployee(
                updatedEmployee
            );


            /* =================================================
               UPDATE IMAGE PREVIEW
            ================================================= */

            if (
                data.employee &&
                data.employee.profileImage
            ) {

                setImagePreview(
                    `${BACKEND_URL}${data.employee.profileImage}?t=${Date.now()}`
                );

            }


            /* =================================================
               RESET FILE
            ================================================= */

            setSelectedFile(null);


            if (
                fileInputRef.current
            ) {

                fileInputRef.current.value =
                    "";

            }


            /* =================================================
               SUCCESS
            ================================================= */

            setSuccess(
                "Profile photo updated successfully."
            );


        } catch (err) {

            console.error(
                "Profile image upload error:",
                err
            );


            setError(
                err.message ||
                "Unable to upload profile image."
            );


        } finally {

            setUploading(false);

        }

    };


    /* =====================================================
       CANCEL IMAGE
    ===================================================== */

    const handleCancelImage = () => {

        setSelectedFile(null);

        setError("");
        setSuccess("");


        if (
            fileInputRef.current
        ) {

            fileInputRef.current.value =
                "";

        }


        /* Restore saved image */

        if (
            employee.profileImage
        ) {

            setImagePreview(
                `${BACKEND_URL}${employee.profileImage}?t=${Date.now()}`
            );

        } else {

            setImagePreview(null);

        }

    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loadingProfile) {

        return (

            <div className="employee-profile-page">

                <div
                    style={{
                        minHeight: "400px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >

                    <div
                        className="spinner-border"
                        role="status"
                    >
                        <span className="visually-hidden">
                            Loading...
                        </span>
                    </div>

                </div>

            </div>

        );

    }


    /* =====================================================
       JSX
    ===================================================== */

    return (

        <div className="employee-profile-page">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="employee-profile-header">

                <div>

                    <span className="employee-profile-tag">
                        EMPLOYEE ACCOUNT
                    </span>

                    <h2>
                        My Profile
                    </h2>

                    <p>
                        Manage your personal information
                        and profile photo.
                    </p>

                </div>


                <div className="employee-profile-header-icon">

                    <i className="bi bi-person-circle"></i>

                </div>

            </div>


            {/* =================================================
                PROFILE CARD
            ================================================= */}

            <div className="employee-profile-card">


                {/* =================================================
                    PROFILE HERO
                ================================================= */}

                <div className="employee-profile-top">


                    {/* PROFILE IMAGE */}

                    <div className="employee-profile-avatar-wrapper">

                        {imagePreview ? (

                            <img
                                src={imagePreview}
                                alt="Employee Profile"
                                className="employee-profile-avatar-image"
                            />

                        ) : (

                            <div className="employee-profile-avatar">

                                {getInitial()}

                            </div>

                        )}

                    </div>


                    {/* EMPLOYEE INFO */}

                    <div className="employee-profile-main-info">

                        <span>
                            EMPLOYEE
                        </span>

                        <h3>
                            {employee.name ||
                                "Employee"}
                        </h3>

                        <p>

                            <i className="bi bi-person-badge"></i>

                            {employee.employeeId ||
                                "Employee ID"}

                        </p>

                    </div>


                    {/* STATUS */}

                    <div
                        className={`employee-profile-status ${employee.isActive
                            ? "status-active"
                            : "status-inactive"
                            }`}
                    >

                        <span className="status-dot"></span>

                        {employee.isActive
                            ? "Active"
                            : "Deactivated"}

                    </div>

                </div>


                {/* =================================================
                    PERSONAL INFORMATION
                ================================================= */}

                <div className="employee-profile-section">


                    <div className="employee-profile-section-title">

                        <div className="section-icon">

                            <i className="bi bi-person"></i>

                        </div>


                        <div>

                            <h3>
                                Personal Information
                            </h3>

                            <p>
                                Your registered employee information
                            </p>

                        </div>

                    </div>


                    <div className="employee-profile-grid">


                        {/* FULL NAME */}

                        <div className="employee-info-box">

                            <span>
                                Full Name
                            </span>

                            <strong>
                                {employee.name ||
                                    "Not Available"}
                            </strong>

                        </div>


                        {/* EMPLOYEE ID */}

                        <div className="employee-info-box">

                            <span>
                                Employee ID
                            </span>

                            <strong>
                                {employee.employeeId ||
                                    "Not Available"}
                            </strong>

                        </div>


                        {/* EMAIL */}

                        <div className="employee-info-box">

                            <span>
                                Email Address
                            </span>

                            <strong>
                                {employee.email ||
                                    "Not Available"}
                            </strong>

                        </div>


                        {/* DEPARTMENT */}

                        <div className="employee-info-box">

                            <span>
                                Department
                            </span>

                            <strong>
                                {employee.department ||
                                    "Not Assigned"}
                            </strong>

                        </div>


                    </div>

                </div>


                {/* =================================================
                    PROFILE PHOTO
                ================================================= */}

                <div className="employee-profile-photo-section">


                    <div className="employee-profile-photo-title">

                        <div className="section-icon">

                            <i className="bi bi-camera"></i>

                        </div>


                        <div>

                            <h3>
                                Profile Photo
                            </h3>

                            <p>
                                Upload a professional photo
                                for your employee profile.
                            </p>

                        </div>

                    </div>


                    <div className="employee-profile-photo-content">


                        {/* PHOTO PREVIEW */}

                        <div className="employee-profile-photo-preview">

                            {imagePreview ? (

                                <img
                                    src={imagePreview}
                                    alt="Profile Preview"
                                />

                            ) : (

                                <div className="employee-profile-photo-placeholder">

                                    {getInitial()}

                                </div>

                            )}

                        </div>


                        {/* CONTROLS */}

                        <div className="employee-profile-photo-controls">


                            {/* FILE INPUT */}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={
                                    handleImageSelect
                                }
                                style={{
                                    display: "none"
                                }}
                            />


                            {/* CHOOSE PHOTO */}

                            <button
                                type="button"
                                className="profile-photo-select-btn"
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                disabled={
                                    uploading
                                }
                            >

                                <i className="bi bi-folder2-open"></i>

                                Choose Photo

                            </button>


                            {/* SAVE PHOTO */}

                            <button
                                type="button"
                                className="profile-photo-upload-btn"
                                onClick={
                                    handleUploadImage
                                }
                                disabled={
                                    uploading ||
                                    !selectedFile
                                }
                            >

                                {uploading ? (

                                    <>

                                        <span
                                            className="spinner-border spinner-border-sm"
                                            role="status"
                                            aria-hidden="true"
                                        ></span>

                                        Uploading...

                                    </>

                                ) : (

                                    <>

                                        <i className="bi bi-cloud-arrow-up"></i>

                                        Save Photo

                                    </>

                                )}

                            </button>


                            {/* CANCEL */}

                            {selectedFile && (

                                <button
                                    type="button"
                                    className="profile-photo-cancel-btn"
                                    onClick={
                                        handleCancelImage
                                    }
                                    disabled={
                                        uploading
                                    }
                                >

                                    <i className="bi bi-x-lg"></i>

                                    Cancel

                                </button>

                            )}


                            <small>
                                JPG, PNG or WEBP • Maximum 2 MB
                            </small>


                        </div>

                    </div>


                    {/* SUCCESS MESSAGE */}

                    {success && (

                        <div className="profile-photo-success">

                            <i className="bi bi-check-circle-fill"></i>

                            {success}

                        </div>

                    )}


                    {/* ERROR MESSAGE */}

                    {error && (

                        <div className="profile-photo-error">

                            <i className="bi bi-exclamation-circle-fill"></i>

                            {error}

                        </div>

                    )}

                </div>


                {/* =================================================
                    ACCOUNT INFORMATION
                ================================================= */}

                <div className="employee-profile-section">


                    <div className="employee-profile-section-title">

                        <div className="section-icon">

                            <i className="bi bi-shield-check"></i>

                        </div>


                        <div>

                            <h3>
                                Account Information
                            </h3>

                            <p>
                                Your employee account status
                            </p>

                        </div>

                    </div>


                    <div className="employee-account-info">


                        {/* STATUS */}

                        <div>

                            <span>
                                Account Status
                            </span>

                            <strong
                                className={
                                    employee.isActive
                                        ? "account-active"
                                        : "account-inactive"
                                }
                            >

                                <i
                                    className={
                                        employee.isActive
                                            ? "bi bi-check-circle-fill"
                                            : "bi bi-x-circle-fill"
                                    }
                                ></i>

                                {employee.isActive
                                    ? "Active"
                                    : "Deactivated"}

                            </strong>

                        </div>


                        {/* TYPE */}

                        <div>

                            <span>
                                Account Type
                            </span>

                            <strong>
                                Employee Account
                            </strong>

                        </div>


                        {/* ACCESS */}

                        <div>

                            <span>
                                Access
                            </span>

                            <strong>
                                Employee Portal
                            </strong>

                        </div>


                    </div>

                </div>


            </div>

        </div>

    );

};

export default EmployeeProfile;