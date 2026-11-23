import { useEffect, useRef, useState } from "react";
import employeeAPI from "../../services/employeeApi";
import "./EmployeeAttendance.css";

const FACE_SERVICE_URL = "http://127.0.0.1:8000";

const EmployeeAttendance = () => {
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);

    const [cameraOpen, setCameraOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const employee = JSON.parse(
        localStorage.getItem("employeeUser") || "{}"
    );

    // =========================
    // LOAD TODAY ATTENDANCE
    // =========================
    const loadAttendance = async () => {
        console.log("🔥 loadAttendance called");

        try {
            const response = await employeeAPI.get("/attendance/my");

            console.log("🔥 Attendance response:", response.data);

            setAttendance(response.data.attendance);
        } catch (error) {
            console.error("🔥 Attendance error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to load attendance"
            );
        } finally {
            console.log("🔥 loading finished");
            setLoading(false);
        }
    };

    // =========================
    // PAGE LOAD
    // =========================
    useEffect(() => {
        console.log("🔥 EmployeeAttendance mounted");

        loadAttendance();

        return () => {
            stopCamera();
        };
    }, []);

    // =========================
    // START CAMERA
    // =========================
    const startCamera = async () => {
        try {
            setCameraLoading(true);
            setError("");
            setMessage("");

            console.log("📷 Starting camera...");

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Your browser does not support camera access."
                );
            }

            // Stop previous stream if any
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => {
                    track.stop();
                });

                streamRef.current = null;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            console.log("📷 Camera stream:", stream);
            console.log(
                "📷 Video tracks:",
                stream.getVideoTracks()
            );

            streamRef.current = stream;

            // First render camera container
            setCameraOpen(true);

        } catch (error) {
            console.error("📷 Camera error:", error);

            setError(
                error?.message ||
                "Camera access nahi mil pa raha hai."
            );
        } finally {
            setCameraLoading(false);
        }
    };

    // =========================
    // ATTACH CAMERA STREAM
    // =========================
    useEffect(() => {
        if (
            !cameraOpen ||
            !streamRef.current ||
            !videoRef.current
        ) {
            return;
        }

        const video = videoRef.current;

        console.log("📷 Attaching stream to video...");

        video.srcObject = streamRef.current;

        const playVideo = async () => {
            try {
                await video.play();

                console.log(
                    "📷 Video playing successfully"
                );
            } catch (error) {
                console.error(
                    "📷 Video play error:",
                    error
                );
            }
        };

        if (video.readyState >= 1) {
            playVideo();
        } else {
            video.onloadedmetadata = playVideo;
        }

        return () => {
            video.onloadedmetadata = null;
        };
    }, [cameraOpen]);

    // =========================
    // STOP CAMERA
    // =========================
    const stopCamera = () => {
        console.log("📷 Stopping camera...");

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOpen(false);
    };

    // =========================
    // CAPTURE FRAME
    // =========================
    const captureFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            throw new Error("Camera is not ready.");
        }

        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            throw new Error(
                "Camera frame is not ready yet. Please wait a moment."
            );
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error(
                "Unable to access canvas."
            );
        }

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return canvas.toDataURL(
            "image/jpeg",
            0.85
        );
    };

    // =========================
    // FACE RECOGNITION
    // =========================
    const recognizeFace = async () => {
        try {
            setActionLoading(true);
            setMessage("");
            setError("");

            console.log("🧠 Capturing face frame...");

            const image = captureFrame();

            console.log(
                "🧠 Sending image to face service..."
            );

            const response = await fetch(
                `${FACE_SERVICE_URL}/recognize`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        image
                    })
                }
            );

            const data = await response.json();

            console.log(
                "🧠 Face recognition response:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.detail ||
                    data.message ||
                    "Face recognition failed."
                );
            }

            if (!data.recognized) {
                setError(
                    data.message ||
                    "Face could not be recognized."
                );

                return;
            }

            const recognizedEmployee =
                data.employee;

            // =========================
            // SECURITY CHECK
            // =========================
            if (
                String(
                    recognizedEmployee?.id
                ).toUpperCase() !==
                String(
                    employee.employeeId
                ).toUpperCase()
            ) {
                setError(
                    "Face recognized, but it does not match your employee account."
                );

                return;
            }

            // =========================
            // CHECK-IN / CHECK-OUT
            // =========================
            if (!attendance?.checkIn) {
                await performCheckIn();
            } else if (!attendance?.checkOut) {
                await performCheckOut();
            } else {
                setMessage(
                    "Today's attendance is already completed."
                );
            }

            stopCamera();

        } catch (error) {
            console.error(
                "Face recognition error:",
                error
            );

            setError(
                error.message ||
                "Unable to verify your face."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // CHECK IN
    // =========================
    const performCheckIn = async () => {
        try {
            const response =
                await employeeAPI.post(
                    "/attendance/check-in"
                );

            setAttendance(
                response.data.attendance
            );

            setMessage(
                "Face verified successfully. Check-in completed."
            );

        } catch (error) {
            console.error(
                "Check-in error:",
                error
            );

            throw new Error(
                error.response?.data?.message ||
                "Unable to check in."
            );
        }
    };

    // =========================
    // CHECK OUT
    // =========================
    const performCheckOut = async () => {
        try {
            const response =
                await employeeAPI.post(
                    "/attendance/check-out"
                );

            setAttendance(
                response.data.attendance
            );

            setMessage(
                "Face verified successfully. Check-out completed."
            );

        } catch (error) {
            console.error(
                "Check-out error:",
                error
            );

            throw new Error(
                error.response?.data?.message ||
                "Unable to check out."
            );
        }
    };

    // =========================
    // MANUAL CHECK-IN
    // =========================
    const handleCheckIn = async () => {
        try {
            setActionLoading(true);
            setMessage("");
            setError("");

            const response =
                await employeeAPI.post(
                    "/attendance/check-in"
                );

            setAttendance(
                response.data.attendance
            );

            setMessage(
                "Check-in successful."
            );

        } catch (error) {
            console.error(
                "Check-in error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to check in."
            );

        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // MANUAL CHECK-OUT
    // =========================
    const handleCheckOut = async () => {
        try {
            setActionLoading(true);
            setMessage("");
            setError("");

            const response =
                await employeeAPI.post(
                    "/attendance/check-out"
                );

            setAttendance(
                response.data.attendance
            );

            setMessage(
                "Check-out successful."
            );

        } catch (error) {
            console.error(
                "Check-out error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to check out."
            );

        } finally {
            setActionLoading(false);
        }
    };

    // =========================
    // FORMAT TIME
    // =========================
    const formatTime = (date) => {
        if (!date) {
            return "--";
        }

        return new Date(date).toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            }
        );
    };

    // =========================
    // FORMAT DATE
    // =========================
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    };

    return (
        <div className="employee-attendance-page">

            {/* =========================
                HEADER
            ========================= */}
            <div className="attendance-page-header">

                <div>
                    <span className="attendance-page-tag">
                        ATTENDANCE
                    </span>

                    <h2>
                        My Attendance
                    </h2>

                    <p>
                        Track your daily attendance and working hours.
                    </p>
                </div>

                <div className="attendance-date-box">

                    <i className="bi bi-calendar3"></i>

                    <div>
                        <span>
                            Today
                        </span>

                        <strong>
                            {formatDate(new Date())}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =========================
                EMPLOYEE CARD
            ========================= */}
            <div className="attendance-employee-card">

                <div className="attendance-employee-avatar">
                    {(employee.name || "E")
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div className="attendance-employee-info">

                    <span>
                        EMPLOYEE
                    </span>

                    <h3>
                        {employee.name || "Employee"}
                    </h3>

                    <p>
                        {employee.employeeId || "Employee ID"}

                        {employee.department
                            ? ` • ${employee.department}`
                            : ""}
                    </p>

                </div>

                <div className="attendance-status-badge">

                    <span
                        className={
                            attendance
                                ? "status-dot present"
                                : "status-dot"
                        }
                    ></span>

                    {attendance
                        ? attendance.status
                        : "Not Marked"}

                </div>

            </div>

            {/* =========================
                MESSAGES
            ========================= */}
            {message && (
                <div className="attendance-alert success">

                    <i className="bi bi-check-circle-fill"></i>

                    {message}

                </div>
            )}

            {error && (
                <div className="attendance-alert error">

                    <i className="bi bi-exclamation-circle-fill"></i>

                    {error}

                </div>
            )}

            {/* =========================
                ATTENDANCE CONTENT
            ========================= */}
            {loading ? (

                <div className="attendance-loading">

                    <div className="attendance-spinner"></div>

                    <p>
                        Loading attendance...
                    </p>

                </div>

            ) : (

                <>

                    {/* =========================
                        TIME CARDS
                    ========================= */}
                    <div className="attendance-time-grid">

                        <div className="attendance-time-card check-in-card">

                            <div className="attendance-time-icon">

                                <i className="bi bi-box-arrow-in-right"></i>

                            </div>

                            <div>

                                <span>
                                    CHECK IN
                                </span>

                                <h3>
                                    {formatTime(
                                        attendance?.checkIn
                                    )}
                                </h3>

                                <p>
                                    Today's check-in time
                                </p>

                            </div>

                        </div>

                        <div className="attendance-time-card check-out-card">

                            <div className="attendance-time-icon">

                                <i className="bi bi-box-arrow-right"></i>

                            </div>

                            <div>

                                <span>
                                    CHECK OUT
                                </span>

                                <h3>
                                    {formatTime(
                                        attendance?.checkOut
                                    )}
                                </h3>

                                <p>
                                    Today's check-out time
                                </p>

                            </div>

                        </div>

                        <div className="attendance-time-card working-hours-card">

                            <div className="attendance-time-icon">

                                <i className="bi bi-clock-history"></i>

                            </div>

                            <div>

                                <span>
                                    WORKING HOURS
                                </span>

                                <h3>
                                    {attendance?.workingHours
                                        ? `${attendance.workingHours} hrs`
                                        : "--"}
                                </h3>

                                <p>
                                    Total working time
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* =========================
                        FACE ATTENDANCE PANEL
                    ========================= */}
                    <div className="face-attendance-panel">

                        <div className="face-attendance-heading">

                            <div className="face-attendance-icon">

                                <i className="bi bi-person-bounding-box"></i>

                            </div>

                            <div>

                                <h3>
                                    Face Recognition Attendance
                                </h3>

                                <p>
                                    Verify your identity using your registered face.
                                </p>

                            </div>

                        </div>

                        {/* =========================
                            CAMERA
                        ========================= */}
                        {cameraOpen && (

                            <div className="face-camera-container">

                                <div className="face-camera-frame">

                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                            background: "#000"
                                        }}
                                    />

                                    <div className="face-scan-overlay">

                                        <div className="face-corner top-left"></div>

                                        <div className="face-corner top-right"></div>

                                        <div className="face-corner bottom-left"></div>

                                        <div className="face-corner bottom-right"></div>

                                        <div className="face-scan-line"></div>

                                    </div>

                                </div>

                                <canvas
                                    ref={canvasRef}
                                    style={{
                                        display: "none"
                                    }}
                                />

                                <div className="face-camera-actions">

                                    <button
                                        type="button"
                                        className="face-verify-button"
                                        onClick={recognizeFace}
                                        disabled={actionLoading}
                                    >

                                        <i className="bi bi-person-check"></i>

                                        {actionLoading
                                            ? "Verifying Face..."
                                            : attendance?.checkIn &&
                                                !attendance?.checkOut
                                                ? "Verify & Check Out"
                                                : "Verify & Check In"}

                                    </button>

                                    <button
                                        type="button"
                                        className="face-cancel-button"
                                        onClick={stopCamera}
                                        disabled={actionLoading}
                                    >

                                        <i className="bi bi-x-lg"></i>

                                        Cancel

                                    </button>

                                </div>

                            </div>

                        )}

                        {/* =========================
                            START CAMERA
                        ========================= */}
                        {!cameraOpen && (

                            <div className="face-start-section">

                                <div className="face-preview-icon">

                                    <i className="bi bi-camera-video"></i>

                                </div>

                                <h4>

                                    {attendance?.checkIn
                                        ? attendance?.checkOut
                                            ? "Attendance Completed"
                                            : "Ready for Check-Out?"
                                        : "Ready to Mark Attendance?"}

                                </h4>

                                <p>

                                    {attendance?.checkIn
                                        ? attendance?.checkOut
                                            ? "Your attendance for today is complete."
                                            : "Verify your face to securely check out."
                                        : "Use face recognition to securely mark your check-in."}

                                </p>

                                {!attendance?.checkOut && (

                                    <button
                                        type="button"
                                        className="face-start-button"
                                        onClick={startCamera}
                                        disabled={cameraLoading}
                                    >

                                        <i className="bi bi-camera"></i>

                                        {cameraLoading
                                            ? "Opening Camera..."
                                            : attendance?.checkIn
                                                ? "Start Face Verification"
                                                : "Start Face Attendance"}

                                    </button>

                                )}

                            </div>

                        )}

                    </div>

                    {/* =========================
                        FALLBACK ACTION PANEL
                    ========================= */}
                    <div className="attendance-action-panel">

                        <div className="attendance-action-content">

                            <div className="attendance-action-icon">

                                <i className="bi bi-fingerprint"></i>

                            </div>

                            <div>

                                <h3>
                                    Manual Attendance
                                </h3>

                                <p>
                                    Use manual attendance only as a fallback
                                    if face recognition is unavailable.
                                </p>

                            </div>

                        </div>

                        <div className="attendance-action-buttons">

                            {!attendance?.checkIn && (

                                <button
                                    type="button"
                                    className="attendance-checkin-button"
                                    onClick={handleCheckIn}
                                    disabled={actionLoading}
                                >

                                    <i className="bi bi-box-arrow-in-right"></i>

                                    {actionLoading
                                        ? "Processing..."
                                        : "Manual Check In"}

                                </button>

                            )}

                            {attendance?.checkIn &&
                                !attendance?.checkOut && (

                                    <button
                                        type="button"
                                        className="attendance-checkout-button"
                                        onClick={handleCheckOut}
                                        disabled={actionLoading}
                                    >

                                        <i className="bi bi-box-arrow-right"></i>

                                        {actionLoading
                                            ? "Processing..."
                                            : "Manual Check Out"}

                                    </button>

                                )}

                        </div>

                    </div>

                    {/* =========================
                        INFORMATION
                    ========================= */}
                    <div className="attendance-info-grid">

                        <div className="attendance-info-card">

                            <div className="attendance-info-icon">

                                <i className="bi bi-shield-check"></i>

                            </div>

                            <div>

                                <h4>
                                    Face Verification
                                </h4>

                                <p>
                                    Your registered face is verified before
                                    attendance is recorded.
                                </p>

                            </div>

                        </div>

                        <div className="attendance-info-card">

                            <div className="attendance-info-icon">

                                <i className="bi bi-info-circle"></i>

                            </div>

                            <div>

                                <h4>
                                    Attendance Status
                                </h4>

                                <p>
                                    Your daily status and working hours
                                    are updated automatically.
                                </p>

                            </div>

                        </div>

                    </div>

                </>

            )}

        </div>
    );
};

export default EmployeeAttendance;
