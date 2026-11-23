import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import employeeAPI from "../../services/employeeApi";
import "./EmployeeLogin.css";

/* ID badge + face check-in illustration (inline SVG, koi extra file nahi) */
const BadgeIllustration = () => (
    <svg
        className="emp-illustration"
        viewBox="0 0 360 320"
        role="img"
        aria-label="Employee ID badge with face check-in"
    >
        <defs>
            <clipPath id="emp-avatar-clip">
                <circle cx="180" cy="118" r="46" />
            </clipPath>
        </defs>

        {/* background rings */}
        <circle cx="180" cy="160" r="150" className="emp-ill-ring" />
        <circle cx="180" cy="160" r="112" className="emp-ill-ring" />

        {/* lanyard */}
        <path d="M166 34L146 0M194 34L214 0" className="emp-ill-strap" />

        {/* badge */}
        <rect x="108" y="30" width="144" height="262" rx="18" className="emp-ill-badge" />
        <rect x="158" y="44" width="44" height="8" rx="4" className="emp-ill-slot" />

        {/* avatar */}
        <circle cx="180" cy="118" r="46" className="emp-ill-avatar" />
        <g clipPath="url(#emp-avatar-clip)">
            <ellipse cx="180" cy="112" rx="17" ry="20" className="emp-ill-person" />
            <path
                d="M138 170c2-26 20-38 42-38s40 12 42 38z"
                className="emp-ill-person"
            />
        </g>

        {/* scan corners around avatar */}
        <g className="emp-ill-corners">
            <path d="M126 82V70a8 8 0 0 1 8-8h12" />
            <path d="M234 82V70a8 8 0 0 0-8-8h-12" />
            <path d="M126 154v12a8 8 0 0 0 8 8h12" />
            <path d="M234 154v12a8 8 0 0 1-8 8h-12" />
        </g>
        <rect x="130" y="64" width="100" height="3" rx="1.5" className="emp-ill-scanline" />

        {/* name lines */}
        <rect x="138" y="196" width="84" height="9" rx="4.5" className="emp-ill-name" />
        <rect x="152" y="213" width="56" height="6" rx="3" className="emp-ill-role" />

        {/* weekly attendance */}
        <g className="emp-ill-days">
            {[138, 159, 180, 201].map((x) => (
                <g key={x} transform={`translate(${x} 252)`}>
                    <circle r="9" className="emp-ill-day-done" />
                    <path d="M-3.5 0.5l2.6 2.6 4.6-5.4" className="emp-ill-tick" />
                </g>
            ))}
            <circle cx="222" cy="252" r="8.2" className="emp-ill-day-todo" />
        </g>
    </svg>
);

const EmployeeLogin = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        employeeId: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.employeeId.trim() || !formData.password) {
            setError("Please enter Employee ID and Password");
            return;
        }

        try {
            setLoading(true);

            const response = await employeeAPI.post(
                "/auth/employee/login",
                {
                    employeeId: formData.employeeId.trim(),
                    password: formData.password
                }
            );

            const { token, user, mustChangePassword } = response.data;

            localStorage.setItem("employeeToken", token);
            localStorage.setItem("employeeUser", JSON.stringify(user));

            localStorage.setItem(
                "employeeMustChangePassword",
                String(mustChangePassword)
            );

            if (mustChangePassword) {
                navigate("/employee/change-password", { replace: true });
            } else {
                navigate("/employee/dashboard", { replace: true });
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="employee-login-page">
            <div className="employee-login-card">

                {/* ---------- Left: form ---------- */}
                <section className="employee-login-panel">

                    <div className="employee-login-icon">
                        <i className="bi bi-person-badge"></i>
                    </div>

                    <h2>Employee Portal</h2>
                    <p className="employee-login-subtitle">
                        Sign in to access your attendance dashboard
                    </p>

                    {error && (
                        <div className="employee-login-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="employee-form-group">
                            <label>Employee ID</label>

                            <div className="employee-input-wrapper">
                                <i className="bi bi-person"></i>

                                <input
                                    type="text"
                                    name="employeeId"
                                    placeholder="Enter Employee ID"
                                    value={formData.employeeId}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="employee-form-group">
                            <label>Password</label>

                            <div className="employee-input-wrapper">
                                <i className="bi bi-lock"></i>

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />

                                <button
                                    type="button"
                                    className="employee-password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    <i className={
                                        showPassword
                                            ? "bi bi-eye-slash"
                                            : "bi bi-eye"
                                    }></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="employee-login-button"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Login to Portal"}
                        </button>

                    </form>

                    {/* <div className="login-switch-wrapper">
                        <span className="login-switch-text">Are you an administrator?</span>
                        <Link to="/admin-login" className="login-switch-link">
                            Admin Portal Login <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div> */}

                    <div className="employee-login-footer">
                        <i className="bi bi-shield-check"></i>
                        Secure Employee Access
                    </div>

                </section>

                {/* ---------- Right: illustration ---------- */}
                <aside className="emp-visual">

                    <div className="emp-visual-copy">
                        <h1>Your attendance, always in sight.</h1>
                        <p>
                            Check your daily records, working hours and
                            leave status in one place.
                        </p>
                    </div>

                    <div className="emp-visual-stage">
                        <BadgeIllustration />

                        <div className="emp-chip emp-chip-present">
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Marked present</span>
                        </div>

                        <div className="emp-chip emp-chip-time">
                            <i className="bi bi-clock"></i>
                            <span>On time today</span>
                        </div>
                    </div>

                </aside>

            </div>
        </div>
    );
};

export default EmployeeLogin;