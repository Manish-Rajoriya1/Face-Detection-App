import { useState } from "react";
import { useNavigate } from "react-router-dom";
import employeeAPI from "../../services/employeeApi";

const EmployeeChangePassword = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.newPassword.length < 12) {
            setError("New password must contain at least 12 characters.");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        try {
            setLoading(true);

            await employeeAPI.put(
                "/auth/employee/change-password",
                form
            );

            localStorage.removeItem("employeeToken");
            localStorage.removeItem("employeeUser");
            localStorage.removeItem("employeeMustChangePassword");

            alert("Password changed successfully. Please login again.");

            navigate("/employee-login", { replace: true });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to change password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="employee-login-page">
            <div className="employee-login-card">
                <div className="employee-login-icon">
                    <i className="bi bi-shield-lock"></i>
                </div>

                <h2>Change Password</h2>

                <p className="employee-login-subtitle">
                    Please create a new password before continuing.
                </p>

                {error && (
                    <div className="employee-login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {[
                        ["currentPassword", "Temporary Password"],
                        ["newPassword", "New Password"],
                        ["confirmPassword", "Confirm New Password"]
                    ].map(([name, label]) => (
                        <div className="employee-form-group" key={name}>
                            <label>{label}</label>
                            <div className="employee-input-wrapper">
                                <i className="bi bi-lock"></i>
                                <input
                                    type="password"
                                    name={name}
                                    value={form[name]}
                                    onChange={handleChange}
                                    placeholder={`Enter ${label}`}
                                    required
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        type="submit"
                        className="employee-login-button"
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Update Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmployeeChangePassword;