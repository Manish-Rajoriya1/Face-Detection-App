import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useNavigate
} from "react-router-dom";

import {
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaSearch,
  FaTimes,
  FaBars
} from "react-icons/fa";

import API from "./services/api";

import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeProtectedRoute from "./components/EmployeeProtectedRoute";

import Sidebar from "./components/Sidebar";
import EmployeeLayout from "./components/EmployeeLayout";

import AdminLogin from "./pages/auth/AdminLogin";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import RegisterEmployee from "./pages/RegisterEmployee";
import AdminProfile from "./pages/admin/AdminProfile";
import AttendanceSettings from "./pages/admin/AttendanceSettings";

import EmployeeLogin from "./pages/employee/EmployeeLogin";
import EmployeeChangePassword from "./pages/employee/EmployeeChangePassword";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeProfile from "./pages/employee/EmployeeProfile";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import AttendanceHistory from "./pages/employee/AttendanceHistory";
import MonthlySummary from "./pages/employee/MonthlySummary";
import AdminAttendance from "./pages/admin/AdminAttendance";
import EmployeeAttendanceSettings from "./pages/employee/EmployeeAttendanceSettings";
import EmployeeDetails from "./pages/admin/EmployeeDetails";
import LeaveRequest from "./pages/employee/LeaveRequest";
import LeaveRequests from "./pages/admin/LeaveRequests";
import FaceCapture from "./pages/FaceCapture";
import Announcements from "./pages/admin/Announcements";


// ======================================================
// ADMIN TOP NAVBAR
// ======================================================

function AdminTopbar({ onToggleSidebar }) {

  const [showLogout, setShowLogout] = useState(false);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const navigate = useNavigate();

  let adminUser = {};

  try {
    adminUser = JSON.parse(
      localStorage.getItem("adminUser") || "{}"
    );
  } catch (error) {
    adminUser = {};
  }


  // ======================================================
  // NOTIFICATION FUNCTIONS
  // ======================================================

  const loadNotifications = async () => {

    try {

      setNotificationLoading(true);

      const response = await API.get("/notifications");

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


  useEffect(() => {

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => clearInterval(interval);

  }, []);


  const markNotificationRead = async (notification) => {

    try {

      if (!notification.isRead) {

        await API.patch(
          `/notifications/${notification._id}/read`
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

      if (!notification.isRead) {

        setUnreadCount(
          (prev) => Math.max(prev - 1, 0)
        );

      }

      if (notification.type === "leave_request") {

        setShowNotifications(false);

        navigate("/admin/leave-requests");

      }

    } catch (error) {

      console.error(
        "Mark notification read error:",
        error
      );

    }

  };


  const markAllNotificationsRead = async () => {

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
        "Mark all notifications error:",
        error
      );

    }

  };


  // ======================================================
  // ADMIN LOGOUT
  // ======================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "adminUser"
    );

    window.location.replace(
      "/admin-login"
    );

  };


  return (
    <>
      <header className="topbar">

        {/* LEFT SECTION WITH MOBILE TOGGLE & SEARCH */}

        <div className="topbar-left-section">

          {/* <button
            type="button"
            className="admin-mobile-toggle"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
          >
            <FaBars />
          </button> */}

          {/* SEARCH */}

          <div className="topbar-search">

            <FaSearch />

            <input
              type="text"
              placeholder="Search..."
            />

          </div>

        </div>


        {/* RIGHT SIDE */}

        <div className="topbar-right">

          {/* ==================================================
                        NOTIFICATION
              ================================================== */}

          <div
            className="notification-wrapper"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center"
            }}
          >

            <button
              type="button"
              className="notification-btn"
              onClick={() => {

                setShowNotifications(
                  (prev) => !prev
                );

                if (!showNotifications) {
                  loadNotifications();
                }

              }}
              aria-label="Notifications"
              style={{
                position: "relative",
                cursor: "pointer"
              }}
            >

              <FaBell />

              {unreadCount > 0 && (

                <span
                  style={{
                    position: "absolute",
                    top: "0px",
                    right: "-2px",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 5px",
                    borderRadius: "20px",
                    background: "#ff4d5e",
                    color: "#fff",
                    border: "2px solid #fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "700",
                    lineHeight: "1",
                    boxSizing: "border-box"
                  }}
                >
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>

              )}

            </button>


            {/* NOTIFICATION DROPDOWN */}

            {showNotifications && (

              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: "-10px",
                  width: "380px",
                  maxWidth: "calc(100vw - 24px)",
                  background: "#fff",
                  border: "1px solid #e8ebf2",
                  borderRadius: "14px",
                  boxShadow:
                    "0 18px 45px rgba(20, 35, 70, 0.15)",
                  zIndex: 9999,
                  overflow: "hidden"
                }}
              >

                {/* HEADER */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 18px",
                    borderBottom:
                      "1px solid #edf0f5"
                  }}
                >

                  <div>

                    <h4
                      style={{
                        margin: 0,
                        fontSize: "15px",
                        color: "#1d2939"
                      }}
                    >
                      Notifications
                    </h4>

                    <span
                      style={{
                        display: "block",
                        marginTop: "3px",
                        fontSize: "11px",
                        color: "#8993a7"
                      }}
                    >
                      {unreadCount > 0
                        ? `${unreadCount} unread`
                        : "All caught up"}
                    </span>

                  </div>


                  {unreadCount > 0 && (

                    <button
                      type="button"
                      onClick={
                        markAllNotificationsRead
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#526dff",
                        fontSize: "11px",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                    >
                      Mark all as read
                    </button>

                  )}

                </div>


                {/* LIST */}

                <div
                  style={{
                    maxHeight: "420px",
                    overflowY: "auto"
                  }}
                >

                  {notificationLoading ? (

                    <div
                      style={{
                        minHeight: "160px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#98a2b3",
                        fontSize: "12px"
                      }}
                    >
                      Loading notifications...
                    </div>

                  ) : notifications.length === 0 ? (

                    <div
                      style={{
                        minHeight: "180px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "7px",
                        color: "#98a2b3",
                        textAlign: "center"
                      }}
                    >

                      <FaBell
                        style={{
                          fontSize: "24px",
                          color: "#c3cad7"
                        }}
                      />

                      <strong
                        style={{
                          color: "#667085",
                          fontSize: "13px"
                        }}
                      >
                        No notifications
                      </strong>

                      <span
                        style={{
                          fontSize: "11px"
                        }}
                      >
                        You're all caught up.
                      </span>

                    </div>

                  ) : (

                    notifications.map(
                      (notification) => (

                        <button
                          type="button"
                          key={notification._id}
                          onClick={() =>
                            markNotificationRead(
                              notification
                            )
                          }
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems:
                              "flex-start",
                            gap: "12px",
                            position: "relative",
                            padding: "14px 16px",
                            border: "none",
                            borderBottom:
                              "1px solid #f0f2f6",
                            background:
                              notification.isRead
                                ? "#fff"
                                : "#f5f7ff",
                            textAlign: "left",
                            cursor: "pointer",
                            boxSizing: "border-box"
                          }}
                        >

                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              flexShrink: 0,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#edf0ff",
                              color: "#526dff",
                              fontSize: "14px"
                            }}
                          >
                            <FaBell />
                          </div>


                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                              paddingRight: "8px"
                            }}
                          >

                            <strong
                              style={{
                                display: "block",
                                color: "#1d2939",
                                fontSize: "12px",
                                marginBottom: "4px"
                              }}
                            >
                              {notification.title}
                            </strong>

                            <p
                              style={{
                                margin: 0,
                                color: "#667085",
                                fontSize: "11px",
                                lineHeight: "1.5"
                              }}
                            >
                              {notification.message}
                            </p>

                            <span
                              style={{
                                display: "block",
                                marginTop: "6px",
                                color: "#98a2b3",
                                fontSize: "9px"
                              }}
                            >
                              {new Date(
                                notification.createdAt
                              ).toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }
                              )}
                            </span>

                          </div>


                          {!notification.isRead && (

                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                flexShrink: 0,
                                background: "#526dff",
                                borderRadius: "50%",
                                marginTop: "5px"
                              }}
                            ></span>

                          )}

                        </button>

                      )
                    )

                  )}

                </div>

              </div>

            )}

          </div>


          {/* ADMIN PROFILE */}

          <div className="profile">

            {adminUser?.profileImage ? (

              <img
                src={`${import.meta.env.VITE_API_BASE_URL}${adminUser.profileImage}`}
                alt="Admin"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  objectFit: "cover"
                }}
              />

            ) : (

              <FaUserCircle />

            )}


            <div>

              <strong>
                {adminUser?.name || "Admin"}
              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>


          {/* LOGOUT */}

          <button
            type="button"
            className="logout-btn"
            onClick={() =>
              setShowLogout(true)
            }
          >

            <FaSignOutAlt />

            <span>
              Logout
            </span>

          </button>

        </div>

      </header>


      {/* ==================================================
                        LOGOUT MODAL
          ================================================== */}

      {showLogout && (

        <div
          className="logout-modal-overlay"
          onClick={() =>
            setShowLogout(false)
          }
        >

          <div
            className="logout-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              className="logout-modal-close"
              onClick={() =>
                setShowLogout(false)
              }
            >
              <FaTimes />
            </button>


            {/* ICON */}

            <div className="logout-modal-icon">
              <FaSignOutAlt />
            </div>


            <h3>
              Logout?
            </h3>


            <p>
              Are you sure you want to
              logout from the Admin panel?
            </p>


            {/* ACTIONS */}

            <div className="logout-modal-actions">

              <button
                type="button"
                className="logout-cancel-btn"
                onClick={() =>
                  setShowLogout(false)
                }
              >
                Cancel
              </button>


              <button
                type="button"
                className="logout-confirm-btn"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}


// ======================================================
// ADMIN LAYOUT
// ======================================================

function AdminLayout() {

  const [mobileOpen, setMobileOpen] =
    useState(false);

  return (

    <div className="app-layout">

      {/* MOBILE BACKDROP OVERLAY */}

      {mobileOpen && (

        <div
          className="admin-sidebar-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />

      )}


      {/* SIDEBAR WRAPPER */}

      <div
        className={`admin-sidebar-wrapper ${mobileOpen ? "open" : ""
          }`}
      >

        <Sidebar
          onCloseMobile={() =>
            setMobileOpen(false)
          }
        />

      </div>


      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOP NAVBAR */}

        <AdminTopbar
          onToggleSidebar={() =>
            setMobileOpen(
              (prev) => !prev
            )
          }
        />

        {/* PAGE CONTENT */}

        <div className="admin-page-content">

          <Outlet />

        </div>

      </main>

    </div>
  );
}


// ======================================================
// MAIN APP
// ======================================================

function App() {

  return (

    <Routes>

      {/* ==================================================
                    DEFAULT ROUTE
          ================================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/employee-login"
            replace
          />
        }
      />


      {/* ==================================================
                    ADMIN LOGIN
          ================================================== */}

      <Route
        path="/admin-login"
        element={
          <AdminLogin />
        }
      />


      {/* ==================================================
                    EMPLOYEE LOGIN
          ================================================== */}

      <Route
        path="/employee-login"
        element={
          <EmployeeLogin />
        }
      />


      {/* ==================================================
                    EMPLOYEE CHANGE PASSWORD
          ================================================== */}

      <Route
        element={
          <EmployeeProtectedRoute />
        }
      >

        <Route
          path="/employee/change-password"
          element={
            <EmployeeChangePassword />
          }
        />

      </Route>


      {/* ==================================================
                    ADMIN PANEL
          ================================================== */}

      <Route
        element={
          <ProtectedRoute />
        }
      >

        <Route
          path="/admin"
          element={
            <AdminLayout />
          }
        >

          {/* Admin Dashboard */}

          <Route
            index
            element={
              <Dashboard />
            }
          />


          {/* Employees */}

          <Route
            path="employees"
            element={
              <Employees />
            }
          />


          {/* Employee Details */}

          <Route
            path="employees/:id"
            element={
              <EmployeeDetails />
            }
          />


          {/* Register Employee */}

          <Route
            path="register-employee"
            element={
              <RegisterEmployee />
            }
          />


          {/* Face Capture */}

          <Route
            path="face-capture/:employeeId"
            element={
              <FaceCapture />
            }
          />


          {/* Attendance */}

          <Route
            path="attendance"
            element={
              <AdminAttendance />
            }
          />


          {/* Attendance Settings */}

          <Route
            path="attendance-settings"
            element={
              <AttendanceSettings />
            }
          />


          {/* Leave Requests */}

          <Route
            path="leave-requests"
            element={
              <LeaveRequests />
            }
          />


          {/* Announcements */}

          <Route
            path="announcements"
            element={
              <Announcements />
            }
          />


          {/* Admin Profile */}

          <Route
            path="admin-profile"
            element={
              <AdminProfile />
            }
          />

        </Route>

      </Route>


      {/* ==================================================
                    EMPLOYEE PANEL
          ================================================== */}

      <Route
        element={
          <EmployeeProtectedRoute />
        }
      >

        <Route
          path="/employee"
          element={
            <EmployeeLayout />
          }
        >

          {/* /employee */}

          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />


          {/* Employee Dashboard */}

          <Route
            path="dashboard"
            element={
              <EmployeeDashboard />
            }
          />


          {/* Employee Profile */}

          <Route
            path="profile"
            element={
              <EmployeeProfile />
            }
          />


          {/* Employee Attendance */}

          <Route
            path="attendance"
            element={
              <EmployeeAttendance />
            }
          />


          {/* Employee Attendance Settings */}

          <Route
            path="settings"
            element={
              <EmployeeAttendanceSettings />
            }
          />


          {/* Employee Details */}

          <Route
            path="employees/:id"
            element={
              <EmployeeDetails />
            }
          />


          {/* Attendance History */}

          <Route
            path="history"
            element={
              <AttendanceHistory />
            }
          />


          {/* Monthly Summary */}

          <Route
            path="monthly-summary"
            element={
              <MonthlySummary />
            }
          />


          {/* Leave Request */}

          <Route
            path="leave-request"
            element={
              <LeaveRequest />
            }
          />

        </Route>

      </Route>


      {/* ==================================================
                    FALLBACK
          ================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/employee-login"
            replace
          />
        }
      />

    </Routes>
  );
}


export default App;