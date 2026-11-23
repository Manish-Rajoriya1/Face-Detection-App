import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaBell,
    FaSearch,
    FaUserCircle,
    FaSignOutAlt,
    FaTimes,
    FaCheckCircle,
    FaCalendarAlt
} from "react-icons/fa";

import API from "../services/api";

function Navbar() {

    const navigate = useNavigate();

    const [showLogoutPopup, setShowLogoutPopup] =
        useState(false);

    const [showNotifications, setShowNotifications] =
        useState(false);

    const [notifications, setNotifications] =
        useState([]);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const [notificationLoading, setNotificationLoading] =
        useState(false);

    const adminData = JSON.parse(
        localStorage.getItem("adminUser") || "{}"
    );

    // =====================================================
    // LOAD NOTIFICATIONS
    // =====================================================

    const loadNotifications = async () => {

        try {

            setNotificationLoading(true);

            const response =
                await API.get("/notifications");

            setNotifications(
                response.data.notifications || []
            );

            setUnreadCount(
                response.data.unreadCount || 0
            );

        } catch (error) {

            console.error(
                "Notification loading error:",
                error
            );

        } finally {

            setNotificationLoading(false);

        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadNotifications();

        const interval = setInterval(() => {
            loadNotifications();
        }, 30000);

        return () => {
            clearInterval(interval);
        };

    }, []);


    // =====================================================
    // NOTIFICATION CLICK
    // =====================================================

    const handleNotificationClick = async (
        notification
    ) => {

        try {

            if (!notification.isRead) {

                await API.patch(
                    `/ notifications / ${notification._id}/read`
                );

            }

            setNotifications((prev) =>
                prev.map((item) =>
                    item._id === notification._id
                        ? {
                            ...item,
                            isRead: true
                        }
                        : item
                )
            );

            setUnreadCount((prev) =>
                notification.isRead
                    ? prev
                    : Math.max(prev - 1, 0)
            );

            setShowNotifications(false);

            navigate("/admin/leave-requests");

        } catch (error) {

            console.error(
                "Notification click error:",
                error
            );

            navigate("/admin/leave-requests");

        }
    };


    // =====================================================
    // MARK ALL AS READ
    // =====================================================

    const handleMarkAllRead = async () => {

        try {

            await API.patch(
                "/notifications/read-all"
            );

            setNotifications((prev) =>
                prev.map((item) => ({
                    ...item,
                    isRead: true
                }))
            );

            setUnreadCount(0);

        } catch (error) {

            console.error(
                "Mark all read error:",
                error
            );

        }
    };


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatNotificationDate = (date) => {

        if (!date) {
            return "";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "adminToken"
        );

        localStorage.removeItem(
            "adminUser"
        );

        navigate("/admin-login", {
            replace: true
        });

    };


    return (
        <>

            {/* =================================================
                        TOPBAR
            ================================================= */}

            <header className="topbar">

                <div className="topbar-search">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Search anything..."
                    />

                </div>


                <div className="topbar-right">


                    {/* =================================================
                                NOTIFICATION
                    ================================================= */}

                    <div className="notification-wrapper">

                        <button
                            type="button"
                            className="notification-btn"
                            onClick={() =>
                                setShowNotifications(
                                    !showNotifications
                                )
                            }
                        >

                            <FaBell />

                            {unreadCount > 0 && (
                                <span className="notification-count">
                                    {unreadCount > 99
                                        ? "99+"
                                        : unreadCount}
                                </span>
                            )}

                        </button>


                        {/* =================================================
                                    NOTIFICATION DROPDOWN
                        ================================================= */}

                        {showNotifications && (

                            <div className="notification-dropdown">


                                <div className="notification-header">

                                    <div>
                                        <h4>
                                            Notifications
                                        </h4>

                                        <span>
                                            {unreadCount > 0
                                                ? `${unreadCount} unread`
                                                : "All caught up"}
                                        </span>
                                    </div>


                                    {unreadCount > 0 && (

                                        <button
                                            type="button"
                                            className="mark-read-btn"
                                            onClick={
                                                handleMarkAllRead
                                            }
                                        >
                                            Mark all read
                                        </button>

                                    )}

                                </div>


                                <div className="notification-list">

                                    {notificationLoading ? (

                                        <div className="notification-empty">

                                            <div className="notification-loader">
                                                Loading...
                                            </div>

                                        </div>

                                    ) : notifications.length === 0 ? (

                                        <div className="notification-empty">

                                            <FaCheckCircle />

                                            <strong>
                                                No notifications
                                            </strong>

                                            <span>
                                                You're all caught up.
                                            </span>

                                        </div>

                                    ) : (

                                        notifications
                                            .slice(0, 10)
                                            .map((notification) => (

                                                <button
                                                    key={
                                                        notification._id
                                                    }
                                                    type="button"
                                                    className={
                                                        notification.isRead
                                                            ? "notification-item"
                                                            : "notification-item unread"
                                                    }
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            notification
                                                        )
                                                    }
                                                >

                                                    <div className="notification-item-icon">

                                                        {notification.type ===
                                                            "leave_request" ? (
                                                            <FaCalendarAlt />
                                                        ) : (
                                                            <FaBell />
                                                        )}

                                                    </div>


                                                    <div className="notification-item-content">

                                                        <strong>
                                                            {
                                                                notification.title
                                                            }
                                                        </strong>

                                                        <p>
                                                            {
                                                                notification.message
                                                            }
                                                        </p>

                                                        <small>
                                                            {
                                                                formatNotificationDate(
                                                                    notification.createdAt
                                                                )
                                                            }
                                                        </small>

                                                    </div>


                                                    {!notification.isRead && (
                                                        <span className="notification-unread-dot"></span>
                                                    )}

                                                </button>

                                            ))

                                    )}

                                </div>


                                <div className="notification-footer">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNotifications(
                                                false
                                            );

                                            navigate(
                                                "/admin/leave-requests"
                                            );
                                        }}
                                    >
                                        View Leave Requests
                                    </button>

                                </div>

                            </div>

                        )}

                    </div>


                    {/* =================================================
                                ADMIN PROFILE
                    ================================================= */}

                    <div className="profile">

                        {adminData.profileImage ? (

                            <img
                                src={`${import.meta.env.VITE_API_BASE_URL}${adminData.profileImage}`}
                                alt="Admin"
                                className="navbar-profile-image"
                            />

                        ) : (

                            <FaUserCircle />

                        )}


                        <div>

                            <strong>
                                {adminData.name ||
                                    "Administrator"}
                            </strong>

                            <span>
                                Admin
                            </span>

                        </div>

                    </div>


                    {/* =================================================
                                LOGOUT
                    ================================================= */}

                    <button
                        className="logout-btn"
                        onClick={() =>
                            setShowLogoutPopup(true)
                        }
                        title="Logout"
                    >

                        <FaSignOutAlt />

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </header>


            {/* =================================================
                    LOGOUT CONFIRMATION POPUP
            ================================================= */}

            {showLogoutPopup && (

                <div
                    className="logout-modal-overlay"
                    onClick={() =>
                        setShowLogoutPopup(false)
                    }
                >

                    <div
                        className="logout-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            className="logout-modal-close"
                            onClick={() =>
                                setShowLogoutPopup(false)
                            }
                        >
                            <FaTimes />
                        </button>


                        <div className="logout-modal-icon">
                            <FaSignOutAlt />
                        </div>


                        <h3>
                            Confirm Logout
                        </h3>


                        <p>
                            Are you sure you want to logout
                            from your Admin account?
                        </p>


                        <div className="logout-modal-actions">

                            <button
                                className="logout-cancel-btn"
                                onClick={() =>
                                    setShowLogoutPopup(false)
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="logout-confirm-btn"
                                onClick={handleLogout}
                            >
                                Yes, Logout
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </>
    );
}

export default Navbar;
