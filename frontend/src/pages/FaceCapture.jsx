import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
    FaCamera,
    FaCheckCircle,
    FaArrowLeft,
    FaRedo,
    FaUser
} from "react-icons/fa";

function FaceCapture() {

    const { employeeId } = useParams();
    const navigate = useNavigate();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] =
        useState(false);

    const [images, setImages] =
        useState([]);

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const startCamera = async () => {

        try {

            setError("");

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: {
                            ideal: 640
                        },
                        height: {
                            ideal: 480
                        },
                        facingMode: "user"
                    },
                    audio: false
                });

            streamRef.current =
                stream;

            setCameraActive(true);

        } catch (err) {

            console.error(
                "Camera Error:",
                err
            );

            setError(
                "Camera start nahi ho paya: " +
                err.message
            );
        }
    };

    const stopCamera = () => {

        if (streamRef.current) {

            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }

        setCameraActive(false);
    };

    useEffect(() => {

        if (
            cameraActive &&
            videoRef.current &&
            streamRef.current
        ) {

            videoRef.current.srcObject =
                streamRef.current;

            videoRef.current
                .play()
                .catch((err) => {

                    console.error(
                        "Video Play Error:",
                        err
                    );

                    setError(
                        "Video display nahi ho raha: " +
                        err.message
                    );
                });
        }

    }, [cameraActive]);

    useEffect(() => {

        return () => {
            stopCamera();
        };

    }, []);

    const captureSample = () => {

        const video =
            videoRef.current;

        const canvas =
            canvasRef.current;

        if (
            !video ||
            !canvas ||
            video.readyState < 2
        ) {

            setError(
                "Camera ready nahi hai. Thoda wait karo."
            );

            return;
        }

        if (images.length >= 15) {

            setError(
                "15 samples already captured."
            );

            return;
        }

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;

        const context =
            canvas.getContext("2d");

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.85
            );

        setImages((previous) => [
            ...previous,
            imageData
        ]);

        setError("");

        setMessage(
            `Sample ${images.length + 1} captured successfully.`
        );
    };

    const resetSamples = () => {

        setImages([]);

        setError("");

        setMessage(
            "Samples reset. Capture again."
        );
    };

    const submitRegistration = async () => {

        if (images.length !== 15) {

            setError(
                "Please capture all 15 samples first."
            );

            return;
        }

        try {

            setLoading(true);

            setError("");

            setMessage(
                "Processing face samples. Please wait..."
            );

            const response =
                await axios.post(
                    `${import.meta.env.VITE_FACE_SERVICE_URL}/register-face`,
                    {
                        employeeId,
                        images
                    },
                    {
                        timeout: 300000
                    }
                );

            setMessage(
                `Success! ${response.data.samples} face samples registered for ${employeeId}.`
            );

            stopCamera();

            setTimeout(() => {

                navigate(
                    "/admin/employees"
                );

            }, 1800);

        } catch (err) {

            console.error(
                "FACE REGISTRATION ERROR:",
                err
            );

            console.log(
                "Response Data:",
                err.response?.data
            );

            console.log(
                "Status Code:",
                err.response?.status
            );

            console.log(
                "Error Message:",
                err.message
            );

            const errorMessage =
                err.response?.data?.detail ||
                err.response?.data?.message ||
                err.message ||
                "Unknown error";

            setError(
                typeof errorMessage ===
                    "string"
                    ? errorMessage
                    : JSON.stringify(
                        errorMessage
                    )
            );

            setMessage("");

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="face-capture-page">

            <div className="page-heading">

                <div>

                    <h2>
                        Face Registration
                    </h2>

                    <p>
                        Capture 15 face samples
                        for employee recognition.
                    </p>

                </div>

                <button
                    className="refresh-btn"
                    onClick={() =>
                        navigate(
                            "/admin/employees"
                        )
                    }
                >
                    <FaArrowLeft />
                    Back to Employees
                </button>

            </div>

            <div className="face-register-card">

                <div className="face-register-heading">

                    <div className="register-icon">
                        <FaUser />
                    </div>

                    <div>

                        <h4>
                            Employee: {employeeId}
                        </h4>

                        <p>
                            Keep your face clearly
                            visible in the camera.
                        </p>

                    </div>

                </div>

                <div className="face-camera-container">

                    {cameraActive ? (

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="face-video"
                        />

                    ) : (

                        <div className="face-camera-placeholder">

                            <FaCamera />

                            <h4>
                                Camera Preview
                            </h4>

                            <p>
                                Start camera to capture
                                employee face samples.
                            </p>

                        </div>

                    )}

                </div>

                <canvas
                    ref={canvasRef}
                    style={{
                        display: "none"
                    }}
                />

                <div className="sample-progress">

                    <div className="sample-progress-heading">

                        <strong>
                            Captured Samples
                        </strong>

                        <span>
                            {images.length} / 15
                        </span>

                    </div>

                    <div className="sample-progress-track">

                        <div
                            className="sample-progress-fill"
                            style={{
                                width:
                                    `${(images.length / 15) * 100}% `
                            }}
                        />

                    </div>

                    <div className="sample-grid">

                        {Array
                            .from({
                                length: 15
                            })
                            .map(
                                (_, index) => (

                                    <div
                                        key={index}
                                        className={
                                            index <
                                                images.length
                                                ? "sample-box captured"
                                                : "sample-box"
                                        }
                                    >

                                        {index <
                                            images.length ? (
                                            <FaCheckCircle />
                                        ) : (
                                            index + 1
                                        )}

                                    </div>

                                )
                            )}

                    </div>

                </div>

                {message && (

                    <div className="face-message">
                        {message}
                    </div>

                )}

                {error && (

                    <div className="face-error">
                        {error}
                    </div>

                )}

                <div className="face-capture-actions">

                    {!cameraActive ? (

                        <button
                            className="save-btn"
                            onClick={
                                startCamera
                            }
                            disabled={loading}
                        >
                            <FaCamera />
                            Start Camera
                        </button>

                    ) : (

                        <button
                            className="save-btn"
                            onClick={
                                captureSample
                            }
                            disabled={
                                images.length >= 15 ||
                                loading
                            }
                        >
                            <FaCamera />

                            Capture Sample (
                            {images.length}/15)
                        </button>

                    )}

                    <button
                        className="cancel-btn"
                        onClick={
                            resetSamples
                        }
                        disabled={
                            images.length === 0 ||
                            loading
                        }
                    >
                        <FaRedo />
                        Reset Samples
                    </button>

                    <button
                        className="save-btn"
                        onClick={
                            submitRegistration
                        }
                        disabled={
                            images.length !== 15 ||
                            loading
                        }
                    >

                        <FaCheckCircle />

                        {loading
                            ? "Processing..."
                            : "Register Face"}

                    </button>

                </div>

                <p className="face-instruction">

                    Capture each sample with a
                    small change in head angle or
                    distance. Keep your face visible,
                    well-lit and inside the camera
                    frame. Only capture your own face
                    with your consent.

                </p>

            </div>

        </div>
    );
}

export default FaceCapture;