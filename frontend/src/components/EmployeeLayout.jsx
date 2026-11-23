import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../pages/employee/EmployeeLayout.css";

const EmployeeLayout = () => {
    const navigate = useNavigate();

    const [mobileOpen, setMobileOpen] = useState(false);

    // Logout confirmation modal
    const [showLogoutModal, setShowLogoutModal] =
        useState(false);

    const employee = JSON.parse(
        localStorage.getItem("employeeUser") || "{}"
    );

    // =====================================================
    // OPEN LOGOUT MODAL
    // =====================================================

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    // =====================================================
    // CLOSE LOGOUT MODAL
    // =====================================================

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    // =====================================================
    // CONFIRM LOGOUT
    // =====================================================

    const handleConfirmLogout = () => {
        localStorage.removeItem("employeeToken");
        localStorage.removeItem("employeeUser");
        localStorage.removeItem(
            "employeeMustChangePassword"
        );
        localStorage.removeItem(
            "mustChangePassword"
        );

        setShowLogoutModal(false);

        navigate("/employee-login", {
            replace: true
        });
    };

    // =====================================================
    // EMPLOYEE MENU
    // =====================================================

    const menuItems = [
        {
            label: "Dashboard",
            path: "/employee/dashboard",
            icon: "bi-grid-1x2"
        },
        {
            label: "My Profile",
            path: "/employee/profile",
            icon: "bi-person"
        },
        {
            label: "My Attendance",
            path: "/employee/attendance",
            icon: "bi-calendar-check"
        },
        {
            label: "Attendance History",
            path: "/employee/history",
            icon: "bi-clock-history"
        },
        {
            label: "Monthly Summary",
            path: "/employee/monthly-summary",
            icon: "bi-bar-chart"
        },
        {
            label: "Leave Request",
            path: "/employee/leave-request",
            icon: "bi-calendar2-plus"
        },
    ];

    return (
        <div className="employee-app">

            {/* =================================================
                MOBILE SIDEBAR OVERLAY
            ================================================= */}

            {mobileOpen && (
                <div
                    className="employee-sidebar-overlay"
                    onClick={() =>
                        setMobileOpen(false)
                    }
                />
            )}

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={`employee-sidebar ${mobileOpen ? "open" : ""
                    }`}
            >

                {/* =================================================
                    BRAND
                ================================================= */}

                <div className="employee-brand">

                    <div className="employee-brand-left">
                        <div className="employee-brand-icon">
                            <i className="bi bi-fingerprint"></i>
                        </div>

                        <div>
                            <h3>FaceAttend</h3>
                            <span>Employee Portal</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="employee-sidebar-close"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>

                </div>

                {/* =================================================
                    MAIN MENU
                ================================================= */}

                <div className="employee-menu-label">
                    MAIN MENU
                </div>

                <nav className="employee-nav">

                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={
                                item.path ===
                                "/employee/dashboard"
                            }
                            className={({ isActive }) =>
                                `employee-nav-link ${isActive
                                    ? "active"
                                    : ""
                                }`
                            }
                            onClick={() =>
                                setMobileOpen(false)
                            }
                        >

                            <i
                                className={`bi ${item.icon}`}
                            ></i>

                            <span>
                                {item.label}
                            </span>

                        </NavLink>
                    ))}

                </nav>

                {/* =================================================
                    ACCOUNT
                ================================================= */}

                <div className="employee-sidebar-bottom">

                    <div className="employee-menu-label">
                        ACCOUNT
                    </div>

                    {/* SETTINGS */}

                    <NavLink
                        to="/employee/settings"
                        className={({ isActive }) =>
                            `employee-nav-link ${isActive
                                ? "active"
                                : ""
                            }`
                        }
                        onClick={() =>
                            setMobileOpen(false)
                        }
                    >

                        <i className="bi bi-gear"></i>

                        <span>
                            Account Settings
                        </span>

                    </NavLink>

                    {/* =================================================
                        LOGOUT
                    ================================================= */}

                    <button
                        type="button"
                        className="employee-nav-link employee-logout"
                        onClick={handleLogoutClick}
                    >

                        <i className="bi bi-box-arrow-right"></i>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div className="employee-sidebar-footer">

                    <i className="bi bi-shield-check"></i>

                    <span>
                        Secure Employee Access
                    </span>

                </div>

            </aside>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="employee-main">

                {/* =================================================
                    TOP BAR
                ================================================= */}

                <header className="employee-topbar">

                    <div className="employee-topbar-left">

                        {/* MOBILE MENU */}

                        <button
                            type="button"
                            className="employee-mobile-toggle"
                            onClick={() =>
                                setMobileOpen(
                                    !mobileOpen
                                )
                            }
                        >

                            <i className="bi bi-list"></i>

                        </button>

                        <div>

                            <span className="employee-topbar-caption">
                                FACEATTEND / EMPLOYEE
                            </span>

                            <h4>
                                Employee Workspace
                            </h4>

                        </div>

                    </div>

                    {/* =================================================
                        USER
                    ================================================= */}

                    <div className="employee-topbar-user">

                        <div className="employee-avatar">

                            {(employee.name || "E")
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                        <div className="employee-topbar-user-info">

                            <strong>
                                {employee.name ||
                                    "Employee"}
                            </strong>

                            <span>
                                {employee.employeeId ||
                                    "Employee ID"}
                            </span>

                        </div>

                    </div>

                </header>

                {/* =================================================
                    PAGE CONTENT
                ================================================= */}

                <section className="employee-content">

                    <Outlet />

                </section>

            </main>


            {/* =====================================================
                LOGOUT CONFIRMATION MODAL
            ===================================================== */}

            {showLogoutModal && (
                <div
                    className="employee-logout-modal-overlay"
                    onClick={handleCancelLogout}
                >

                    <div
                        className="employee-logout-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        {/* CLOSE BUTTON */}

                        <button
                            type="button"
                            className="employee-logout-modal-close"
                            onClick={handleCancelLogout}
                            aria-label="Close logout popup"
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>


                        {/* ICON */}

                        <div className="employee-logout-modal-icon">

                            <i className="bi bi-box-arrow-right"></i>

                        </div>


                        {/* TITLE */}

                        <h3>
                            Logout?
                        </h3>


                        {/* MESSAGE */}

                        <p>
                            Are you sure you want to
                            logout from your employee
                            account?
                        </p>


                        {/* BUTTONS */}

                        <div className="employee-logout-modal-actions">

                            <button
                                type="button"
                                className="employee-logout-cancel-btn"
                                onClick={
                                    handleCancelLogout
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="employee-logout-confirm-btn"
                                onClick={
                                    handleConfirmLogout
                                }
                            >
                                <i className="bi bi-box-arrow-right"></i>

                                Logout
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default EmployeeLayout;