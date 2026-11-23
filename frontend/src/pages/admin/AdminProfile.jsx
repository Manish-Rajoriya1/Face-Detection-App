
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUserCircle,
    FaCamera,
    FaSave,
    FaLock,
    FaUser,
    FaEnvelope,
    FaEye,
    FaEyeSlash,
    FaTrash
} from "react-icons/fa";

import API from "../../services/api";

const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function AdminProfile() {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        profileImage: "",
        createdAt: ""
    });

    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState("");

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const photoUrl = preview ||
        (profile.profileImage
            ? `${IMAGE_BASE_URL}${profile.profileImage}`
            : "");

    const fetchProfile = async () => {
        try {
            const response = await API.get("/auth/admin/profile");

            setProfile({
                name: response.data.name || "",
                email: response.data.email || "",
                profileImage: response.data.profileImage || "",
                createdAt: response.data.createdAt || ""
            });

        } catch (err) {
            if (err.response?.status === 401 ||
                err.response?.status === 403) {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminUser");
                navigate("/admin-login", { replace: true });
                return;
            }

            setError("Unable to load admin profile.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
        setProfile({
            ...profile,
            [e.target.name]: e.target.value
        });
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            const response = await API.put(
                "/auth/admin/profile",
                {
                    name: profile.name,
                    email: profile.email
                }
            );

            const updatedAdmin = {
                ...JSON.parse(localStorage.getItem("adminUser") || "{}"),
                name: response.data.admin.name,
                email: response.data.admin.email,
                profileImage: response.data.admin.profileImage || ""
            };

            localStorage.setItem(
                "adminUser",
                JSON.stringify(updatedAdmin)
            );

            setProfile((previous) => ({
                ...previous,
                name: response.data.admin.name,
                email: response.data.admin.email
            }));

            setMessage("Profile updated successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Profile update failed."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoSelect = (e) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(selectedFile.type)) {
            setError("Please select a JPG, PNG or WEBP image.");
            return;
        }

        if (selectedFile.size > 2 * 1024 * 1024) {
            setError("Image size must be less than 2 MB.");
            return;
        }

        setError("");
        setMessage("");
        setPhoto(selectedFile);

        setPreview(URL.createObjectURL(selectedFile));
    };

    const handlePhotoUpload = async () => {
        if (!photo) {
            setError("Please select a photo first.");
            return;
        }

        const formData = new FormData();
        formData.append("profileImage", photo);

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const response = await API.post(
                "/auth/admin/profile/photo",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            const updatedImage = response.data.profileImage;

            setProfile((previous) => ({
                ...previous,
                profileImage: updatedImage
            }));

            const adminData = JSON.parse(
                localStorage.getItem("adminUser") || "{}"
            );

            localStorage.setItem(
                "adminUser",
                JSON.stringify({
                    ...adminData,
                    profileImage: updatedImage
                })
            );

            setPhoto(null);
            setPreview("");
            setMessage("Profile photo updated successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Photo upload failed."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoRemove = async () => {
        if (!window.confirm("Are you sure you want to remove your profile photo?")) {
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {
            await API.delete("/auth/admin/profile/photo");

            setProfile((previous) => ({
                ...previous,
                profileImage: ""
            }));

            const adminData = JSON.parse(
                localStorage.getItem("adminUser") || "{}"
            );

            localStorage.setItem(
                "adminUser",
                JSON.stringify({
                    ...adminData,
                    profileImage: ""
                })
            );

            setPhoto(null);
            setPreview("");
            setMessage("Profile photo removed successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to remove photo."
            );
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const response = await API.put(
                "/auth/admin/change-password",
                passwords
            );

            setMessage(response.data.message);

            setPasswords({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            // Require fresh login after password change
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");

            navigate("/admin-login", {
                replace: true
            });

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Password change failed."
            );
        } finally {
            setSaving(false);
        }
    };

    const togglePassword = (field) => {
        setShowPasswords((previous) => ({
            ...previous,
            [field]: !previous[field]
        }));
    };

    if (loading) {
        return <div className="profile-loading">Loading profile...</div>;
    }

    return (
        <div className="admin-settings-page">

            <div className="settings-page-heading">
                <div>
                    <h2>Profile Settings</h2>
                    <p>Manage your admin account and security.</p>
                </div>
            </div>

            {message && (
                <div className="settings-success">{message}</div>
            )}

            {error && (
                <div className="settings-error">{error}</div>
            )}

            {/* PROFILE PHOTO */}
            <section className="settings-card">

                <div className="settings-card-heading">
                    <FaUserCircle />
                    <div>
                        <h3>Profile Photo</h3>
                        <p>Update your account picture.</p>
                    </div>
                </div>

                <div className="profile-photo-content">

                    <div className="profile-photo-preview">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Admin profile" />
                        ) : (
                            <FaUserCircle />
                        )}
                    </div>

                    <div className="photo-actions">
                        <label className="photo-upload-btn">
                            <FaCamera /> Choose Photo
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoSelect}
                                hidden
                            />
                        </label>

                        <p>JPG, PNG or WEBP. Maximum 2 MB.</p>

                        {photo && (
                            <button
                                className="settings-save-btn"
                                onClick={handlePhotoUpload}
                                disabled={saving}
                            >
                                <FaSave />
                                {saving ? "Uploading..." : "Upload Photo"}
                            </button>
                        )}

                        {profile.profileImage && (
                            <button
                                className="photo-remove-btn"
                                onClick={handlePhotoRemove}
                                disabled={saving}
                            >
                                <FaTrash /> Remove Photo
                            </button>
                        )}
                    </div>

                </div>

            </section>

            {/* PERSONAL INFORMATION */}
            <section className="settings-card">

                <div className="settings-card-heading">
                    <FaUser />
                    <div>
                        <h3>Personal Information</h3>
                        <p>Update your admin account details.</p>
                    </div>
                </div>

                <form onSubmit={handleProfileSave}>

                    <div className="settings-form-grid">

                        <div className="settings-field">
                            <label>Full Name</label>
                            <div className="settings-input">
                                <FaUser />
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="settings-field">
                            <label>Email Address</label>
                            <div className="settings-input">
                                <FaEnvelope />
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>
                        </div>

                    </div>

                    <div className="settings-field account-date">
                        <label>Account Created</label>
                        <input
                            type="text"
                            value={
                                profile.createdAt
                                    ? new Date(profile.createdAt).toLocaleDateString()
                                    : "Not available"
                            }
                            readOnly
                        />
                    </div>

                    <button
                        type="submit"
                        className="settings-save-btn"
                        disabled={saving}
                    >
                        <FaSave />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                </form>

            </section>

            {/* CHANGE PASSWORD */}
            <section className="settings-card">

                <div className="settings-card-heading">
                    <FaLock />
                    <div>
                        <h3>Change Password</h3>
                        <p>Keep your admin account secure.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange}>

                    {[
                        {
                            key: "currentPassword",
                            label: "Current Password",
                            showKey: "current"
                        },
                        {
                            key: "newPassword",
                            label: "New Password",
                            showKey: "new"
                        },
                        {
                            key: "confirmPassword",
                            label: "Confirm New Password",
                            showKey: "confirm"
                        }
                    ].map((field) => (

                        <div className="settings-field" key={field.key}>

                            <label>{field.label}</label>

                            <div className="settings-input">
                                <FaLock />

                                <input
                                    type={
                                        showPasswords[field.showKey]
                                            ? "text"
                                            : "password"
                                    }
                                    value={passwords[field.key]}
                                    onChange={(e) =>
                                        setPasswords((previous) => ({
                                            ...previous,
                                            [field.key]: e.target.value
                                        }))
                                    }
                                    minLength={field.key === "currentPassword" ? undefined : 12}
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-eye-btn"
                                    onClick={() =>
                                        togglePassword(field.showKey)
                                    }
                                >
                                    {showPasswords[field.showKey]
                                        ? <FaEyeSlash />
                                        : <FaEye />
                                    }
                                </button>

                            </div>

                        </div>

                    ))}

                    <p className="password-hint">
                        New password must contain at least 12 characters.
                        After changing it, you will need to log in again.
                    </p>

                    <button
                        type="submit"
                        className="settings-save-btn"
                        disabled={saving}
                    >
                        <FaLock />
                        {saving ? "Updating..." : "Update Password"}
                    </button>

                </form>

            </section>

        </div>
    );
}

export default AdminProfile;
