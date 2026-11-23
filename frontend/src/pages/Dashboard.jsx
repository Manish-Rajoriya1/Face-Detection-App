
import { useEffect, useRef, useState } from "react";
import axios from "axios";

import {
    FaUsers,
    FaUserCheck,
    FaUserTimes,
    FaClock,
    FaCamera,
    FaStop,
    FaFingerprint
} from "react-icons/fa";

function Dashboard() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const busyRef = useRef(false);
    const activeRef = useRef(false);

    const [cameraActive, setCameraActive] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [cameraError, setCameraError] = useState("");
    const [processing, setProcessing] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        absent: 0
    });

    const stopCamera = () => {
        activeRef.current = false;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
        setProcessing(false);
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(
                "http://localhost:5000/api/employees"
            );

            const employees = Array.isArray(response.data)
                ? response.data
                : response.data.employees || [];

            setStats((previous) => ({
                ...previous,
                total: employees.length,
                absent: Math.max(0, employees.length - previous.present)
            }));
        } catch (error) {
            console.error("Employee stats error:", error);
        }
    };

    useEffect(() => {
        fetchStats();

        return () => {
            activeRef.current = false;

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (!cameraActive || !videoRef.current || !streamRef.current) {
            return;
        }

        videoRef.current.srcObject = streamRef.current;

        videoRef.current.play().catch((error) => {
            console.error("Video play error:", error);
            setCameraError("Camera preview start nahi ho paya.");
        });
    }, [cameraActive]);

    const startCamera = async () => {
        try {
            setCameraError("");
            setRecognition(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user"
                },
                audio: false
            });

            streamRef.current = stream;
            activeRef.current = true;
            setCameraActive(true);

        } catch (error) {
            console.error("Camera error:", error);
            setCameraError(
                "Camera access failed: " + error.message
            );
        }
    };

    const recognizeLoop = async () => {
        if (!activeRef.current) return;

        if (
            !videoRef.current ||
            videoRef.current.readyState < 2 ||
            busyRef.current
        ) {
            timerRef.current = setTimeout(recognizeLoop, 1000);
            return;
        }

        busyRef.current = true;
        setProcessing(true);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = 640;
            canvas.height = 480;

            const context = canvas.getContext("2d");

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const image = canvas.toDataURL("image/jpeg", 0.75);

            const response = await axios.post(
                "http://127.0.0.1:8000/recognize",
                { image },
                { timeout: 30000 }
            );

            if (activeRef.current) {
                setRecognition(response.data);
            }


        } catch (error) {
            console.error("Recognition error:", error);

            if (activeRef.current) {
                setRecognition({
                    recognized: false,
                    status: "error",
                    message:
                        error.response?.data?.detail ||
                        "Recognition service unavailable."
                });
            }

        } finally {
            busyRef.current = false;
            setProcessing(false);

            if (activeRef.current) {
                timerRef.current = setTimeout(recognizeLoop, 100);
            }
        }
    };

    useEffect(() => {
        if (cameraActive) {
            timerRef.current = setTimeout(recognizeLoop, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [cameraActive]);

    const statsCards = [
        {
            title: "Total Employees",
            value: stats.total,
            icon: <FaUsers />,
            color: "blue",
            note: "Registered employees"
        },
        {
            title: "Present Today",
            value: stats.present,
            icon: <FaUserCheck />,
            color: "green",
            note: "Attendance marked"
        },
        {
            title: "Absent Today",
            value: stats.absent,
            icon: <FaUserTimes />,
            color: "red",
            note: "Not checked in"
        },
        {
            title: "Attendance Rate",
            value: stats.total
                ? `${Math.round((stats.present / stats.total) * 100)}%`
                : "0%",
            icon: <FaClock />,
            color: "orange",
            note: "Today's attendance"
        }
    ];

    const isRecognized =
        recognition?.recognized === true;

    return (
        <div className="dashboard-page">

            <div className="page-heading">
                <div>
                    <h2>Dashboard Overview</h2>
                    <p>Welcome back! Here's what's happening today.</p>
                </div>

                <span className="date-label">
                    {new Date().toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    })}
                </span>
            </div>

            <div className="stats-grid">
                {statsCards.map((item, index) => (
                    <div className="stat-card" key={index}>
                        <div className={`stat-icon ${item.color}`}>
                            {item.icon}
                        </div>

                        <div>
                            <p>{item.title}</p>
                            <h3>{item.value}</h3>
                            <span>{item.note}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-content">

                <div className="camera-card">

                    <div className="section-heading">
                        <div>
                            <h4>Live Face Recognition</h4>
                            <p>AI-powered employee identification</p>
                        </div>

                        <span className={
                            cameraActive ? "online-status" : "offline-status"
                        }>
                            <span></span>
                            {cameraActive ? "Camera Online" : "Camera Offline"}
                        </span>
                    </div>

                    <div className="live-camera-box">

                        {cameraActive ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="live-video"
                            />
                        ) : (
                            <div className="camera-placeholder">
                                <FaCamera />
                                <h5>Camera Preview</h5>
                                <p>Start recognition to activate your webcam.</p>
                            </div>
                        )}

                        <canvas
                            ref={canvasRef}
                            style={{ display: "none" }}
                        />

                    </div>

                    <div className="recognition-result">

                        {isRecognized ? (
                            <>
                                <FaUserCheck className="result-success-icon" />

                                <div>
                                    <strong>{recognition.employee?.name}</strong>
                                    <p>
                                        {recognition.employee?.id} ·
                                        {" "}{recognition.employee?.department || "—"}
                                    </p>
                                    <span className="recognized-label">
                                        Employee Recognized
                                    </span>
                                </div>
                            </>
                        ) : (
                            <>
                                <FaFingerprint className="result-unknown-icon" />

                                <div>
                                    <strong>
                                        {recognition?.status === "error"
                                            ? "Service Error"
                                            : recognition
                                                ? "Unknown Person"
                                                : "Waiting for Recognition"}
                                    </strong>

                                    <p>
                                        {recognition?.message ||
                                            "Keep your face clearly visible in the camera."}
                                    </p>
                                </div>
                            </>
                        )}

                    </div>

                    {processing && (
                        <p className="processing-text">
                            AI is processing camera frame...
                        </p>
                    )}

                    {cameraError && (
                        <p className="face-error">{cameraError}</p>
                    )}

                    <div className="camera-actions">

                        {!cameraActive ? (
                            <button
                                className="save-btn"
                                onClick={startCamera}
                            >
                                <FaCamera /> Start Recognition
                            </button>
                        ) : (
                            <button
                                className="stop-recognition-btn"
                                onClick={stopCamera}
                            >
                                <FaStop /> Stop Recognition
                            </button>
                        )}

                    </div>

                    <div className="camera-footer">
                        <span>AI Engine: DeepFace Facenet512</span>
                        <span>Mode: Local Processing</span>
                    </div>

                </div>

                <div className="activity-card">
                    <h4>Recognition Details</h4>
                    <p className="activity-subtitle">
                        Latest camera recognition result
                    </p>

                    {recognition ? (
                        <div className="recognition-details">
                            <p>
                                <strong>Status:</strong>{" "}
                                {recognition.status}
                            </p>

                            {recognition.employee && (
                                <>
                                    <p>
                                        <strong>Employee:</strong>{" "}
                                        {recognition.employee.name}
                                    </p>
                                    <p>
                                        <strong>Employee ID:</strong>{" "}
                                        {recognition.employee.id}
                                    </p>
                                    <p>
                                        <strong>Department:</strong>{" "}
                                        {recognition.employee.department || "—"}
                                    </p>
                                </>
                            )}

                            <p>
                                <strong>Distance:</strong>{" "}
                                {recognition.distance ?? "—"}
                            </p>

                            <p>
                                <strong>Margin:</strong>{" "}
                                {recognition.margin ?? "—"}
                            </p>

                            <p className="activity-subtitle">
                                {recognition.message}
                            </p>
                        </div>
                    ) : (
                        <div className="empty-activity">
                            <FaClock />
                            <p>No recognition activity yet</p>
                            <span>Start the camera to identify an employee.</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default Dashboard;
