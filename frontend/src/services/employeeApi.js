import axios from "axios";

const employeeAPI = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

// ======================================================
// ATTACH EMPLOYEE TOKEN
// ======================================================

employeeAPI.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("employeeToken");

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

// ======================================================
// AUTOMATIC EMPLOYEE DEACTIVATION HANDLER
// ======================================================

employeeAPI.interceptors.response.use(

    (response) => {
        return response;
    },

    (error) => {

        const response =
            error.response;

        // --------------------------------------------------
        // Employee has been deactivated by Admin
        // --------------------------------------------------

        if (
            response &&
            response.status === 403 &&
            response.data?.code ===
            "EMPLOYEE_DEACTIVATED"
        ) {

            // Remove ONLY employee session
            localStorage.removeItem(
                "employeeToken"
            );

            localStorage.removeItem(
                "employeeUser"
            );

            localStorage.removeItem(
                "employeeMustChangePassword"
            );

            localStorage.removeItem(
                "mustChangePassword"
            );

            // ------------------------------------------------
            // IMPORTANT:
            // Go to EMPLOYEE login only.
            // Do NOT go to Admin login.
            // ------------------------------------------------

            window.location.replace(
                "/employee-login"
            );
        }

        return Promise.reject(error);
    }
);

export default employeeAPI;