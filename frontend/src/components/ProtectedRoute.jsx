
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {

    const token = localStorage.getItem("adminToken");
    const userData = localStorage.getItem("adminUser");

    let user = null;

    try {
        user = userData ? JSON.parse(userData) : null;
    } catch {
        user = null;
    }

    if (!token || user?.role !== "admin") {
        return <Navigate to="/admin-login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
