import { useEffect, useState } from "react";
import API from "../../services/api";
import "./AttendanceSettings.css";

function AttendanceSettings() {

    const [settings, setSettings] = useState({
        officeStartTime: "09:30",
        officeEndTime: "18:00",
        lateAfterMinutes: 15,
        halfDayAfterTime: "11:00",
        minimumFullDayHours: 7,
        minimumHalfDayHours: 4,
        lunchEnabled: true,
        lunchStartTime: "13:00",
        lunchEndTime: "14:00",
        lunchMode: "employee",
        workingDays: [1, 2, 3, 4, 5, 6],
        attendanceFinalizeTime: "23:00",
        isActive: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    // ==========================================
    // LOAD SETTINGS
    // ==========================================

    useEffect(() => {

        const loadSettings = async () => {

            try {

                setLoading(true);

                const response =
                    await API.get(
                        "/attendance-settings"
                    );

                if (response.data?.settings) {

                    setSettings(
                        response.data.settings
                    );

                }

            } catch (error) {

                console.error(
                    "Attendance settings error:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load attendance settings."
                );

            } finally {

                setLoading(false);

            }
        };

        loadSettings();

    }, []);


    // ==========================================
    // INPUT CHANGE
    // ==========================================

    const handleChange = (event) => {

        const {
            name,
            value,
            type,
            checked
        } = event.target;

        setSettings((previous) => ({
            ...previous,
            [name]:
                type === "checkbox"
                    ? checked
                    : value
        }));

    };


    // ==========================================
    // WORKING DAYS
    // ==========================================

    const handleWorkingDay = (day) => {

        setSettings((previous) => {

            const currentDays =
                previous.workingDays || [];

            const exists =
                currentDays.includes(day);

            const updatedDays = exists
                ? currentDays.filter(
                    (item) => item !== day
                )
                : [
                    ...currentDays,
                    day
                ].sort(
                    (a, b) => a - b
                );

            return {
                ...previous,
                workingDays: updatedDays
            };

        });

    };


    // ==========================================
    // SAVE SETTINGS
    // ==========================================

    const handleSave = async (event) => {

        event.preventDefault();

        try {

            setSaving(true);
            setMessage("");
            setError("");

            const response =
                await API.put(
                    "/attendance-settings",
                    {
                        ...settings,
                        lateAfterMinutes:
                            Number(
                                settings.lateAfterMinutes
                            ),
                        minimumFullDayHours:
                            Number(
                                settings.minimumFullDayHours
                            ),
                        minimumHalfDayHours:
                            Number(
                                settings.minimumHalfDayHours
                            )
                    }
                );

            if (response.data?.settings) {

                setSettings(
                    response.data.settings
                );

            }

            setMessage(
                "Attendance settings saved successfully."
            );

        } catch (error) {

            console.error(
                "Save attendance settings error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to save attendance settings."
            );

        } finally {

            setSaving(false);

        }

    };


    if (loading) {

        return (
            <div className="page-container attendance-settings-page">

                <div className="placeholder-page">

                    <h2>
                        Attendance Settings
                    </h2>

                    <p>
                        Loading settings...
                    </p>

                </div>

            </div>
        );

    }


    return (

        <div className="page-container attendance-settings-page">

            {/* ======================================
                HEADER
            ====================================== */}

            <div
                style={{
                    marginBottom: "25px"
                }}
            >

                <h2
                    style={{
                        marginBottom: "8px"
                    }}
                >
                    Attendance Settings
                </h2>

                <p
                    style={{
                        margin: 0,
                        color: "#667085"
                    }}
                >
                    Configure office timing and
                    attendance rules.
                </p>

            </div>


            {/* ======================================
                MESSAGE
            ====================================== */}

            {message && (

                <div
                    style={{
                        padding: "12px 16px",
                        marginBottom: "20px",
                        borderRadius: "8px",
                        background: "#ecfdf3",
                        color: "#027a48"
                    }}
                >
                    {message}
                </div>

            )}


            {error && (

                <div
                    style={{
                        padding: "12px 16px",
                        marginBottom: "20px",
                        borderRadius: "8px",
                        background: "#fef3f2",
                        color: "#b42318"
                    }}
                >
                    {error}
                </div>

            )}


            <form onSubmit={handleSave}>

                {/* ======================================
                    OFFICE TIMING
                ====================================== */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <h3>
                            Office Timing
                        </h3>

                        <p>
                            Set the normal working hours.
                        </p>

                    </div>


                    <div className="settings-grid">

                        <div className="settings-field">

                            <label>
                                Office Start Time
                            </label>

                            <input
                                type="time"
                                name="officeStartTime"
                                value={
                                    settings.officeStartTime
                                }
                                onChange={handleChange}
                            />

                        </div>


                        <div className="settings-field">

                            <label>
                                Office End Time
                            </label>

                            <input
                                type="time"
                                name="officeEndTime"
                                value={
                                    settings.officeEndTime
                                }
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                </div>


                {/* ======================================
                    LATE / HALF DAY
                ====================================== */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <h3>
                            Late & Half Day Rules
                        </h3>

                        <p>
                            Configure late arrival and
                            half-day rules.
                        </p>

                    </div>


                    <div className="settings-grid">

                        <div className="settings-field">

                            <label>
                                Late After
                            </label>

                            <div className="input-with-text">

                                <input
                                    type="number"
                                    min="0"
                                    name="lateAfterMinutes"
                                    value={
                                        settings.lateAfterMinutes
                                    }
                                    onChange={handleChange}
                                />

                                <span>
                                    minutes
                                </span>

                            </div>

                        </div>


                        <div className="settings-field">

                            <label>
                                Half Day After
                            </label>

                            <input
                                type="time"
                                name="halfDayAfterTime"
                                value={
                                    settings.halfDayAfterTime
                                }
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                </div>


                {/* ======================================
                    WORKING HOURS
                ====================================== */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <h3>
                            Working Hours
                        </h3>

                        <p>
                            Minimum hours required for
                            full day and half day.
                        </p>

                    </div>


                    <div className="settings-grid">

                        <div className="settings-field">

                            <label>
                                Full Day Minimum
                            </label>

                            <div className="input-with-text">

                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    name="minimumFullDayHours"
                                    value={
                                        settings.minimumFullDayHours
                                    }
                                    onChange={handleChange}
                                />

                                <span>
                                    hours
                                </span>

                            </div>

                        </div>


                        <div className="settings-field">

                            <label>
                                Half Day Minimum
                            </label>

                            <div className="input-with-text">

                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    name="minimumHalfDayHours"
                                    value={
                                        settings.minimumHalfDayHours
                                    }
                                    onChange={handleChange}
                                />

                                <span>
                                    hours
                                </span>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ======================================
                    LUNCH
                ====================================== */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <h3>
                            Lunch Break
                        </h3>

                        <p>
                            Configure the office lunch
                            break.
                        </p>

                    </div>


                    <div className="settings-toggle-row">

                        <div>

                            <strong>
                                Enable Lunch
                            </strong>

                            <p>
                                Enable lunch break
                                timing for employees.
                            </p>

                        </div>


                        <label className="switch">

                            <input
                                type="checkbox"
                                name="lunchEnabled"
                                checked={
                                    settings.lunchEnabled
                                }
                                onChange={handleChange}
                            />

                            <span className="slider"></span>

                        </label>

                    </div>


                    {settings.lunchEnabled && (

                        <div className="settings-grid">

                            <div className="settings-field">

                                <label>
                                    Lunch Start
                                </label>

                                <input
                                    type="time"
                                    name="lunchStartTime"
                                    value={
                                        settings.lunchStartTime
                                    }
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="settings-field">

                                <label>
                                    Lunch End
                                </label>

                                <input
                                    type="time"
                                    name="lunchEndTime"
                                    value={
                                        settings.lunchEndTime
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                    )}

                </div>


                {/* ======================================
                    WORKING DAYS
                ====================================== */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <h3>
                            Working Days
                        </h3>

                        <p>
                            Select the days when attendance
                            should be recorded.
                        </p>

                    </div>


                    <div className="working-days">

                        {[
                            [1, "Monday"],
                            [2, "Tuesday"],
                            [3, "Wednesday"],
                            [4, "Thursday"],
                            [5, "Friday"],
                            [6, "Saturday"],
                            [0, "Sunday"]
                        ].map(
                            ([day, label]) => (

                                <button
                                    key={day}
                                    type="button"
                                    className={
                                        settings.workingDays?.includes(day)
                                            ? "working-day active"
                                            : "working-day"
                                    }
                                    onClick={() =>
                                        handleWorkingDay(day)
                                    }
                                >
                                    {label}
                                </button>

                            )
                        )}

                    </div>

                </div>


                {/* ======================================
                    FINALIZE TIME
                ====================================== */}

                <div className="settings-card">

                    <div className="settings-card-header">

                        <h3>
                            Attendance Finalization
                        </h3>

                        <p>
                            Time after which attendance
                            for the day is finalized.
                        </p>

                    </div>


                    <div className="settings-grid">

                        <div className="settings-field">

                            <label>
                                Finalize Attendance At
                            </label>

                            <input
                                type="time"
                                name="attendanceFinalizeTime"
                                value={
                                    settings.attendanceFinalizeTime
                                }
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                </div>


                {/* ======================================
                    SAVE
                ====================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "25px"
                    }}
                >

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            background: "#526dff",
                            color: "#ffffff",
                            fontWeight: "600",
                            cursor: saving
                                ? "not-allowed"
                                : "pointer",
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Settings"}
                    </button>

                </div>

            </form>

        </div>
    );
}

export default AttendanceSettings;
