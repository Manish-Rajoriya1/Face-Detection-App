const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");


// =====================================================
// VERIFY JWT TOKEN
// =====================================================
const verifyToken = async (req, res, next) => {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }


        // Get token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Authentication token missing"
            });
        }


        // Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // Save decoded user information
        req.user = decoded;


        // =================================================
        // EMPLOYEE ACCOUNT STATUS CHECK
        // =================================================
        if (decoded.role === "employee") {

            const employee = await Employee.findById(
                decoded.id
            ).select(
                "_id employeeId isActive"
            );


            // Employee does not exist
            if (!employee) {
                return res.status(401).json({
                    message: "Employee account not found"
                });
            }


            // Employee has been deactivated by Admin
            if (employee.isActive === false) {

                return res.status(403).json({
                    code: "EMPLOYEE_DEACTIVATED",
                    message:
                        "Your account has been deactivated by Admin."
                });
            }


            // Add employeeId from database
            req.user.employeeId =
                employee.employeeId;
        }


        // Everything is valid
        next();

    } catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );


        // JWT expired
        if (
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                message:
                    "Session expired. Please login again."
            });
        }


        // Invalid JWT
        return res.status(401).json({
            message:
                "Invalid or expired token"
        });
    }
};


// =====================================================
// ROLE AUTHORIZATION
// =====================================================
const allowRoles = (...roles) => {

    return (req, res, next) => {

        if (
            !req.user ||
            !roles.includes(req.user.role)
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};


// =====================================================
// EXPORT
// =====================================================
module.exports = {
    verifyToken,
    allowRoles
};