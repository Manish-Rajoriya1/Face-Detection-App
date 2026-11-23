import { NavLink } from "react-router-dom";

import {
    FaThLarge,
    FaUsers,
    FaCalendarCheck,
    FaUserPlus,
    FaCamera,
    FaFingerprint,
    FaUserCog,
    FaClock,
    FaUmbrellaBeach,
    FaBullhorn,
    FaTimes
} from "react-icons/fa";

function Sidebar({ onCloseMobile }) {
    const handleLinkClick = () => {
        if (onCloseMobile) {
            onCloseMobile();
        }
    };

    return (
        <aside className="sidebar">

            {/* =================================================
                        BRAND
                ================================================= */}

            <div className="brand">

                <div className="brand-left">
                    <div className="brand-icon">
                        <FaFingerprint />
                    </div>

                    <div>
                        <h5>FaceAttend</h5>
                        <span>Attendance System</span>
                    </div>
                </div>

                {/* MOBILE CLOSE BUTTON */}
                {/* <button
                    type="button"
                    className="admin-sidebar-close"
                    onClick={onCloseMobile}
                    aria-label="Close Sidebar"
                >
                    <FaTimes />
                </button> */}

            </div>


            {/* =================================================
                        MAIN MENU
                ================================================= */}

            <p className="menu-heading">
                MAIN MENU
            </p>

            <nav className="sidebar-menu">

                {/* DASHBOARD */}

                <NavLink
                    to="/"
                    end
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaThLarge />

                    <span>
                        Dashboard
                    </span>
                </NavLink>


                {/* EMPLOYEES */}

                <NavLink
                    to="/employees"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaUsers />

                    <span>
                        Employees
                    </span>
                </NavLink>


                {/* REGISTER EMPLOYEE */}

                <NavLink
                    to="/register-employee"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaUserPlus />

                    <span>
                        Register Employee
                    </span>
                </NavLink>


                {/* ATTENDANCE */}

                <NavLink
                    to="/attendance"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaCalendarCheck />

                    <span>
                        Attendance
                    </span>
                </NavLink>


                {/* ATTENDANCE SETTINGS */}

                <NavLink
                    to="/attendance-settings"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaClock />

                    <span>
                        Attendance Settings
                    </span>
                </NavLink>


                {/* LEAVE REQUESTS */}

                <NavLink
                    to="/leave-requests"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaUmbrellaBeach />

                    <span>
                        Leave Requests
                    </span>
                </NavLink>


                {/* =================================================
                            ANNOUNCEMENTS
                    ================================================= */}

                <NavLink
                    to="/announcements"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaBullhorn />

                    <span>
                        Announcements
                    </span>
                </NavLink>

            </nav>


            {/* =================================================
                        ACCOUNT
                ================================================= */}

            <p className="menu-heading settings-heading">
                ACCOUNT
            </p>

            <nav className="sidebar-menu">

                {/* PROFILE SETTINGS */}

                <NavLink
                    to="/admin-profile"
                    onClick={handleLinkClick}
                    className={({ isActive }) =>
                        isActive
                            ? "menu-link active"
                            : "menu-link"
                    }
                >
                    <FaUserCog />

                    <span>
                        Profile Settings
                    </span>
                </NavLink>

            </nav>


            {/* =================================================
                        SIDEBAR BOTTOM
                ================================================= */}

            <div className="sidebar-bottom">

                <div className="camera-status">

                    <FaCamera />

                    <div>

                        <strong>
                            Face Recognition
                        </strong>

                        <span>
                            Local AI System
                        </span>

                    </div>

                </div>

            </div>

        </aside>
    );
}

export default Sidebar;