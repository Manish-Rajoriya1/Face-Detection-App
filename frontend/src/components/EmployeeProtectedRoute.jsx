import {
    Navigate,
    Outlet,
    useLocation
} from "react-router-dom";

// ======================================================
// EMPLOYEE PROTECTED ROUTE
// ======================================================

const EmployeeProtectedRoute = () => {

    const location =
        useLocation();

    // --------------------------------------------------
    // Get employee session
    // --------------------------------------------------

    const token =
        localStorage.getItem(
            "employeeToken"
        );

    // --------------------------------------------------
    // Password change flag
    // --------------------------------------------------

    const mustChangePassword =
        localStorage.getItem(
            "employeeMustChangePassword"
        ) === "true";

    // ==================================================
    // NO EMPLOYEE TOKEN
    // ==================================================

    if (!token) {

        return (
            <Navigate
                to="/employee-login"
                replace
            />
        );
    }

    // ==================================================
    // PASSWORD CHANGE REQUIRED
    // ==================================================

    if (
        mustChangePassword &&
        location.pathname !==
        "/employee/change-password"
    ) {

        return (
            <Navigate
                to="/employee/change-password"
                replace
            />
        );
    }

    // ==================================================
    // PASSWORD ALREADY CHANGED
    // ==================================================

    if (
        !mustChangePassword &&
        location.pathname ===
        "/employee/change-password"
    ) {

        return (
            <Navigate
                to="/employee/dashboard"
                replace
            />
        );
    }

    // ==================================================
    // EMPLOYEE IS AUTHENTICATED
    // ==================================================

    return <Outlet />;
};

export default EmployeeProtectedRoute;