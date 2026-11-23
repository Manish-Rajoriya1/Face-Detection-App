import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FaUserShield,
    FaEye,
    FaEyeSlash,
    FaLock,
    FaEnvelope,
    FaArrowRight,
    FaCheckCircle,
    FaClock
} from "react-icons/fa";

import API from "../../services/api";
import "./AdminLogin.css"; // path apne folder ke hisab se check kar lena

/* Face-scan illustration (inline SVG, koi extra file nahi chahiye) */
function ScanIllustration() {
    return (
        <svg
            className="scan-illustration"
            viewBox="0 0 360 320"
            role="img"
            aria-label="Face being scanned for attendance"
        >
            {/* background rings */}
            <circle cx="180" cy="160" r="150" className="ill-ring" />
            <circle cx="180" cy="160" r="112" className="ill-ring" />

            {/* shoulders */}
            <path
                d="M92 292c0-48 38-78 88-78s88 30 88 78z"
                className="ill-body"
            />

            {/* head */}
            <ellipse cx="180" cy="142" rx="54" ry="64" className="ill-head" />

            {/* simple face features */}
            <circle cx="160" cy="136" r="4" className="ill-feature" />
            <circle cx="200" cy="136" r="4" className="ill-feature" />
            <path
                d="M165 168q15 12 30 0"
                className="ill-mouth"
                fill="none"
            />

            {/* landmark dots */}
            <g className="ill-dots">
                <circle cx="150" cy="112" r="2.5" />
                <circle cx="180" cy="104" r="2.5" />
                <circle cx="210" cy="112" r="2.5" />
                <circle cx="140" cy="150" r="2.5" />
                <circle cx="220" cy="150" r="2.5" />
                <circle cx="180" cy="152" r="2.5" />
                <circle cx="156" cy="190" r="2.5" />
                <circle cx="204" cy="190" r="2.5" />
            </g>

            {/* scan frame corners */}
            <g className="ill-corners">
                <path d="M104 92V70a8 8 0 0 1 8-8h22" />
                <path d="M256 92V70a8 8 0 0 0-8-8h-22" />
                <path d="M104 212v22a8 8 0 0 0 8 8h22" />
                <path d="M256 212v22a8 8 0 0 1-8 8h-22" />
            </g>

            {/* moving scan line */}
            <rect
                x="108"
                y="62"
                width="144"
                height="3"
                rx="1.5"
                className="ill-scanline"
            />
        </svg>
    );
}

function AdminLogin() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
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
        setLoading(true);

        try {

            const response = await API.post(
                "/auth/admin/login",
                formData
            );

            const { token, user } = response.data;

            localStorage.setItem("adminToken", token);
            localStorage.setItem(
                "adminUser",
                JSON.stringify(user)
            );

            navigate("/admin", { replace: true });

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
        <div className="admin-login-page">

            <div className="admin-login-card">

                {/* ---------- Left: illustration ---------- */}
                <aside className="admin-login-visual">

                    <div className="visual-copy">
                        <h1>Attendance, verified by face.</h1>
                        <p>
                            Track check-ins, manage employees and view
                            reports from one place.
                        </p>
                    </div>

                    <div className="visual-stage">
                        <ScanIllustration />

                        <div className="visual-chip chip-match">
                            <FaCheckCircle />
                            <span>Identity matched</span>
                        </div>

                        <div className="visual-chip chip-time">
                            <FaClock />
                            <span>Check-in 09:02 AM</span>
                        </div>
                    </div>

                </aside>

                {/* ---------- Right: form ---------- */}
                <section className="admin-login-panel">

                    <div className="admin-login-logo">
                        <FaUserShield />
                    </div>

                    <div className="admin-login-heading">
                        <h2>Admin Login</h2>
                        <p>
                            Face Attendance Management System
                        </p>
                    </div>

                    {error && (
                        <div className="admin-login-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="admin-form-group">
                            <label>Email Address</label>

                            <div className="admin-input-wrapper">
                                <FaEnvelope />

                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter admin email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="admin-form-group">
                            <label>Password</label>

                            <div className="admin-input-wrapper">
                                <FaLock />

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword
                                        ? <FaEyeSlash />
                                        : <FaEye />
                                    }
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="admin-login-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing In..."
                                : "Sign In"}
                        </button>

                    </form>

                    {/* <div className="login-switch-wrapper">
                        <span className="login-switch-text">Are you an employee?</span>
                        <Link to="/employee-login" className="login-switch-link">
                            Employee Portal Login <FaArrowRight />
                        </Link>
                    </div> */}

                    <div className="admin-login-footer">
                        <span>Secure Admin Access</span>
                        <span>© 2026 Face Attendance App</span>
                    </div>

                </section>

            </div>

        </div>
    );
}

export default AdminLogin;
