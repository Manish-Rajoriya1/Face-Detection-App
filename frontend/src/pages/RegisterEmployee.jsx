import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaUserPlus,
    FaSave,
    FaArrowLeft,
    FaCopy,
    FaKey,
    FaCheckCircle
} from "react-icons/fa";

import API from "../services/api";

function RegisterEmployee() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        employeeId: "",
        name: "",
        email: "",
        department: ""
    });

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [credentials, setCredentials] =
        useState(null);

    const [copied, setCopied] =
        useState(false);

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");
        setCredentials(null);

        try {

            const response =
                await API.post(
                    "/employees",
                    formData
                );

            setSuccess(
                "Employee and login account created successfully!"
            );

            setCredentials({
                employeeId:
                    response.data.employee.employeeId,

                name:
                    response.data.employee.name,

                email:
                    response.data.employee.email,

                temporaryPassword:
                    response.data.temporaryPassword
            });

            setFormData({
                employeeId: "",
                name: "",
                email: "",
                department: ""
            });

        } catch (err) {

            console.error(
                "Registration error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Employee registration failed."
            );

        } finally {

            setLoading(false);
        }
    };

    const handleCopyCredentials = async () => {

        if (!credentials) return;

        const text = [
            "FaceAttend Employee Login Details",
            `Employee Name: ${credentials.name} `,
            `Employee ID: ${credentials.employeeId} `,
            `Email: ${credentials.email} `,
            `Temporary Password: ${credentials.temporaryPassword} `,
            "Please change your password after your first login."
        ].join("\n");

        try {

            await navigator.clipboard.writeText(
                text
            );

            setCopied(true);

            setTimeout(
                () => setCopied(false),
                2000
            );

        } catch {

            setError(
                "Unable to copy. Please copy the credentials manually."
            );
        }
    };

    return (
        <div className="register-page">

            <div className="page-heading">

                <div>

                    <h2>
                        Register Employee
                    </h2>

                    <p>
                        Create a new employee and
                        login account.
                    </p>

                </div>

                <button
                    className="refresh-btn"
                    onClick={() =>
                        navigate(
                            "/admin/employees"
                        )
                    }
                >
                    <FaArrowLeft />
                    Back to Employees
                </button>

            </div>

            <div className="register-card">

                <div className="register-card-heading">

                    <div className="register-icon">
                        <FaUserPlus />
                    </div>

                    <div>

                        <h4>
                            Employee Information
                        </h4>

                        <p>
                            Enter the employee
                            details below.
                        </p>

                    </div>

                </div>

                {error && (

                    <div className="form-alert error-alert">
                        {error}
                    </div>

                )}

                {success && (

                    <div className="form-alert success-alert">
                        {success}
                    </div>

                )}

                {credentials && (

                    <div className="employee-credentials">

                        <div className="credentials-heading">

                            <FaCheckCircle />

                            <div>

                                <h4>
                                    Employee Account Created!
                                </h4>

                                <p>
                                    Share these login
                                    details securely
                                    with the employee.
                                </p>

                            </div>

                        </div>

                        <div className="credential-row">

                            <span>
                                Employee Name
                            </span>

                            <strong>
                                {credentials.name}
                            </strong>

                        </div>

                        <div className="credential-row">

                            <span>
                                Employee ID
                            </span>

                            <strong>
                                {credentials.employeeId}
                            </strong>

                        </div>

                        <div className="credential-row">

                            <span>
                                Email
                            </span>

                            <strong>
                                {credentials.email}
                            </strong>

                        </div>

                        <div className="credential-row password-credential">

                            <span>
                                Temporary Password
                            </span>

                            <strong>
                                {
                                    credentials.temporaryPassword
                                }
                            </strong>

                        </div>

                        <p className="credentials-warning">

                            <FaKey />

                            This password is shown
                            only once. The employee
                            must change it after
                            first login.

                        </p>

                        <button
                            type="button"
                            className="copy-credentials-btn"
                            onClick={
                                handleCopyCredentials
                            }
                        >

                            <FaCopy />

                            {copied
                                ? "Copied Successfully"
                                : "Copy Login Details"}

                        </button>

                        <button
                            type="button"
                            className="view-employees-btn"
                            onClick={() =>
                                navigate(
                                    "/admin/employees"
                                )
                            }
                        >
                            View Employees
                        </button>

                    </div>

                )}

                <form
                    onSubmit={handleSubmit}
                >

                    <div className="register-form-grid">

                        <div className="form-group-custom">

                            <label>
                                Employee ID *
                            </label>

                            <input
                                type="text"
                                name="employeeId"
                                placeholder="Example: EMP003"
                                value={
                                    formData.employeeId
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>

                        <div className="form-group-custom">

                            <label>
                                Employee Name *
                            </label>

                            <input
                                type="text"
                                name="name"
                                placeholder="Enter full name"
                                value={
                                    formData.name
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>

                        <div className="form-group-custom">

                            <label>
                                Email Address *
                            </label>

                            <input
                                type="email"
                                name="email"
                                placeholder="employee@example.com"
                                value={
                                    formData.email
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            />

                        </div>

                        <div className="form-group-custom">

                            <label>
                                Department *
                            </label>

                            <select
                                name="department"
                                value={
                                    formData.department
                                }
                                onChange={
                                    handleChange
                                }
                                required
                            >

                                <option value="">
                                    Select Department
                                </option>

                                <option value="IT">
                                    IT
                                </option>

                                <option value="HR">
                                    HR
                                </option>

                                <option value="Finance">
                                    Finance
                                </option>

                                <option value="Marketing">
                                    Marketing
                                </option>

                                <option value="Management">
                                    Management
                                </option>

                                <option value="Soft.">
                                    Soft.
                                </option>

                                <option value="Other">
                                    Other
                                </option>

                            </select>

                        </div>

                    </div>

                    <div className="register-note">

                        <strong>
                            Note:
                        </strong>{" "}

                        A temporary login password
                        will be generated automatically.
                        Face registration will be
                        completed separately.

                    </div>

                    <div className="register-actions">

                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={() =>
                                navigate(
                                    "/admin/employees"
                                )
                            }
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="save-btn"
                            disabled={loading}
                        >

                            <FaSave />

                            {loading
                                ? "Creating Account..."
                                : "Create Employee Account"}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default RegisterEmployee;
