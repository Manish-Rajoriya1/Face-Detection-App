
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("../models/Admin");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error("Admin details are missing in .env");
        }

        if (password.length < 12) {
            throw new Error("Admin password must be at least 12 characters");
        }

        const existingAdmin = await Admin.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingAdmin) {
            console.log("Admin already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin account created successfully.");

    } catch (error) {
        console.error("Admin creation failed:", error.message);

    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();
