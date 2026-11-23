import {
    useEffect,
    useState
} from "react";

import API from "../../services/api";

import {
    FaBullhorn,
    FaCalendarAlt,
    FaExclamationTriangle,
    FaPaperPlane,
    FaUsers,
    FaUser,
    FaCheckCircle
} from "react-icons/fa";

import "./Announcements.css";


function Announcements() {

    const [employees, setEmployees] =
        useState([]);

    const [form, setForm] = useState({
        title: "",
        message: "",
        type: "announcement",
        recipientType: "all",
        employeeId: "",
        holidayFrom: "",
        holidayTo: ""
    });


    const [loading, setLoading] =
        useState(false);

    const [employeesLoading, setEmployeesLoading] =
        useState(true);

    const [successMessage, setSuccessMessage] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");


    // =====================================================
    // LOAD EMPLOYEES
    // =====================================================

    useEffect(() => {

        const loadEmployees =
            async () => {

                try {

                    setEmployeesLoading(true);

                    const response =
                        await API.get(
                            "/notifications/announcement/employees"
                        );

                    setEmployees(
                        response.data.employees || []
                    );

                } catch (error) {

                    console.error(
                        "Load employees error:",
                        error
                    );

                    setErrorMessage(
                        error.response?.data?.message ||
                        "Unable to load employees."
                    );

                } finally {

                    setEmployeesLoading(false);

                }

            };


        loadEmployees();

    }, []);


    // =====================================================
    // HANDLE INPUT
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setForm((previous) => ({
            ...previous,
            [name]: value
        }));


        setSuccessMessage("");
        setErrorMessage("");

    };


    // =====================================================
    // SUBMIT
    // =====================================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        setSuccessMessage("");
        setErrorMessage("");


        // -------------------------------------------------
        // TITLE VALIDATION
        // -------------------------------------------------

        if (
            !form.title.trim()
        ) {

            setErrorMessage(
                "Please enter announcement title."
            );

            return;
        }


        // -------------------------------------------------
        // MESSAGE VALIDATION
        // -------------------------------------------------

        if (
            !form.message.trim()
        ) {

            setErrorMessage(
                "Please enter announcement message."
            );

            return;
        }


        // -------------------------------------------------
        // HOLIDAY DATE VALIDATION
        // -------------------------------------------------

        if (
            form.type === "holiday" &&
            !form.holidayFrom
        ) {

            setErrorMessage(
                "Please select holiday start date."
            );

            return;
        }


        if (
            form.type === "holiday" &&
            !form.holidayTo
        ) {

            setErrorMessage(
                "Please select holiday end date."
            );

            return;
        }


        if (
            form.type === "holiday" &&
            form.holidayFrom > form.holidayTo
        ) {

            setErrorMessage(
                "Holiday end date cannot be before start date."
            );

            return;
        }


        // -------------------------------------------------
        // EMPLOYEE VALIDATION
        // -------------------------------------------------

        if (
            form.recipientType ===
            "employee" &&
            !form.employeeId
        ) {

            setErrorMessage(
                "Please select an employee."
            );

            return;
        }


        try {

            setLoading(true);


            const response =
                await API.post(
                    "/notifications/announcement",
                    {
                        title:
                            form.title.trim(),

                        message:
                            form.message.trim(),

                        type:
                            form.type,

                        recipientType:
                            form.recipientType,

                        employeeId:
                            form.recipientType ===
                                "employee"
                                ? form.employeeId
                                : null,

                        holidayFrom:
                            form.type === "holiday"
                                ? form.holidayFrom
                                : null,

                        holidayTo:
                            form.type === "holiday"
                                ? form.holidayTo
                                : null
                    }
                );


            setSuccessMessage(
                response.data.message ||
                "Announcement sent successfully."
            );


            setForm({
                title: "",
                message: "",
                type: "announcement",
                recipientType: "all",
                employeeId: "",
                holidayFrom: "",
                holidayTo: ""
            });


        } catch (error) {

            console.error(
                "Send announcement error:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Unable to send announcement."
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // FORMAT HOLIDAY DATE FOR PREVIEW
    // =====================================================

    const formatHolidayDate = (date) => {

        if (!date) {
            return "";
        }

        const selectedDate =
            new Date(`${date} T00:00:00`);

        return selectedDate.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    };


    // =====================================================
    // RETURN
    // =====================================================

    return (

        <div className="announcements-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="announcements-header">

                <div>

                    <span className="announcements-eyebrow">
                        ADMIN / COMMUNICATION
                    </span>

                    <h1>
                        Announcements
                    </h1>

                    <p>
                        Send holidays, important notices and
                        announcements directly to employees.
                    </p>

                </div>


                <div className="announcements-header-icon">
                    <FaBullhorn />
                </div>

            </div>


            {/* =================================================
                SUCCESS
            ================================================= */}

            {successMessage && (

                <div className="announcement-alert success">

                    <FaCheckCircle />

                    <span>
                        {successMessage}
                    </span>

                </div>

            )}


            {/* =================================================
                ERROR
            ================================================= */}

            {errorMessage && (

                <div className="announcement-alert error">

                    <FaExclamationTriangle />

                    <span>
                        {errorMessage}
                    </span>

                </div>

            )}


            <div className="announcements-layout">

                {/* =================================================
                    FORM
                ================================================= */}

                <div className="announcement-card">

                    <div className="announcement-card-header">

                        <div className="announcement-card-icon">
                            <FaBullhorn />
                        </div>

                        <div>

                            <h2>
                                Create Announcement
                            </h2>

                            <p>
                                Create a message for your employees.
                            </p>

                        </div>

                    </div>


                    <form
                        onSubmit={handleSubmit}
                        className="announcement-form"
                    >

                        {/* =================================================
                            TYPE
                        ================================================= */}

                        <div className="announcement-field">

                            <label>
                                Announcement Type
                            </label>

                            <select
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                            >

                                <option value="announcement">
                                    General Announcement
                                </option>

                                <option value="holiday">
                                    Holiday
                                </option>

                                <option value="important">
                                    Important Notice
                                </option>

                            </select>

                        </div>


                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <div className="announcement-field">

                            <label>
                                Title
                            </label>

                            <input
                                type="text"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                placeholder="e.g. Diwali Holiday"
                                maxLength={120}
                            />

                        </div>


                        {/* =================================================
                            HOLIDAY DATES
                        ================================================= */}

                        {form.type === "holiday" && (

                            <div className="announcement-holiday-dates">

                                <div className="announcement-field">

                                    <label>
                                        Holiday From
                                    </label>

                                    <input
                                        type="date"
                                        name="holidayFrom"
                                        value={form.holidayFrom}
                                        onChange={handleChange}
                                    />

                                </div>


                                <div className="announcement-field">

                                    <label>
                                        Holiday To
                                    </label>

                                    <input
                                        type="date"
                                        name="holidayTo"
                                        value={form.holidayTo}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                        )}


                        {/* =================================================
                            MESSAGE
                        ================================================= */}

                        <div className="announcement-field">

                            <label>
                                Message
                            </label>

                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                placeholder="Write your announcement here..."
                                rows="7"
                                maxLength={1000}
                            />

                            <small>
                                {form.message.length}/1000
                            </small>

                        </div>


                        {/* =================================================
                            RECIPIENT
                        ================================================= */}

                        <div className="announcement-field">

                            <label>
                                Send To
                            </label>

                            <div className="recipient-options">

                                <button
                                    type="button"
                                    className={
                                        form.recipientType ===
                                            "all"
                                            ? "recipient-option active"
                                            : "recipient-option"
                                    }
                                    onClick={() =>
                                        setForm(
                                            (previous) => ({
                                                ...previous,
                                                recipientType:
                                                    "all",
                                                employeeId:
                                                    ""
                                            })
                                        )
                                    }
                                >

                                    <FaUsers />

                                    <span>
                                        All Employees
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    className={
                                        form.recipientType ===
                                            "employee"
                                            ? "recipient-option active"
                                            : "recipient-option"
                                    }
                                    onClick={() =>
                                        setForm(
                                            (previous) => ({
                                                ...previous,
                                                recipientType:
                                                    "employee"
                                            })
                                        )
                                    }
                                >

                                    <FaUser />

                                    <span>
                                        Specific Employee
                                    </span>

                                </button>

                            </div>

                        </div>


                        {/* =================================================
                            EMPLOYEE
                        ================================================= */}

                        {form.recipientType ===
                            "employee" && (

                                <div className="announcement-field">

                                    <label>
                                        Select Employee
                                    </label>

                                    <select
                                        name="employeeId"
                                        value={form.employeeId}
                                        onChange={handleChange}
                                        disabled={
                                            employeesLoading
                                        }
                                    >

                                        <option value="">
                                            {employeesLoading
                                                ? "Loading employees..."
                                                : "Select employee"}
                                        </option>

                                        {employees.map(
                                            (employee) => (

                                                <option
                                                    key={
                                                        employee._id
                                                    }
                                                    value={
                                                        employee._id
                                                    }
                                                >

                                                    {
                                                        employee.name
                                                    }{" "}

                                                    (
                                                    {
                                                        employee.employeeId
                                                    }
                                                    )

                                                </option>

                                            )
                                        )}

                                    </select>

                                </div>

                            )}


                        {/* =================================================
                            SUBMIT
                        ================================================= */}

                        <button
                            type="submit"
                            className="announcement-submit-btn"
                            disabled={loading}
                        >

                            <FaPaperPlane />

                            {loading
                                ? "Sending..."
                                : "Publish Announcement"}

                        </button>

                    </form>

                </div>


                {/* =================================================
                    PREVIEW
                ================================================= */}

                <div className="announcement-preview-card">

                    <div className="announcement-preview-heading">

                        <div>

                            <span>
                                LIVE PREVIEW
                            </span>

                            <h2>
                                Employee View
                            </h2>

                        </div>

                        <FaBullhorn />

                    </div>


                    <div
                        className={`announcement - preview ${form.type} `}
                    >

                        <div className="announcement-preview-icon">

                            {form.type ===
                                "holiday" ? (

                                <FaCalendarAlt />

                            ) : form.type ===
                                "important" ? (

                                <FaExclamationTriangle />

                            ) : (

                                <FaBullhorn />

                            )}

                        </div>


                        <div>

                            <span className="announcement-preview-label">

                                {form.type ===
                                    "holiday"
                                    ? "HOLIDAY"
                                    : form.type ===
                                        "important"
                                        ? "IMPORTANT NOTICE"
                                        : "ANNOUNCEMENT"}

                            </span>


                            <h3>
                                {form.title ||
                                    "Announcement Title"}
                            </h3>


                            {/* =================================================
                                HOLIDAY DATE PREVIEW
                            ================================================= */}

                            {form.type === "holiday" && (
                                <div className="announcement-preview-holiday-date">

                                    <FaCalendarAlt />

                                    <span>

                                        {form.holidayFrom &&
                                            form.holidayTo ? (

                                            <>
                                                {formatHolidayDate(
                                                    form.holidayFrom
                                                )}

                                                {" → "}

                                                {formatHolidayDate(
                                                    form.holidayTo
                                                )}
                                            </>

                                        ) : form.holidayFrom ? (

                                            <>
                                                From{" "}
                                                {formatHolidayDate(
                                                    form.holidayFrom
                                                )}
                                            </>

                                        ) : (

                                            "Select holiday start and end date"

                                        )}

                                    </span>

                                </div>
                            )}


                            <p>
                                {form.message ||
                                    "Your announcement message will appear here."}
                            </p>


                            <small>
                                Just now
                            </small>

                        </div>

                    </div>


                    <div className="announcement-preview-note">

                        <FaUsers />

                        <span>
                            {form.recipientType ===
                                "all"
                                ? "This announcement will be sent to all active employees."
                                : "This announcement will be sent to the selected employee."}
                        </span>

                    </div>

                </div>

            </div>

        </div>

    );

}


export default Announcements;