import cv2
import requests
import time
from deepface import DeepFace


BACKEND_URL = "http://localhost:5000/api/employees"

EMPLOYEE_ID = "EMP001"

TOTAL_SAMPLES = 15


print()
print("======================================")
print("   MULTI-SAMPLE FACE REGISTRATION")
print("======================================")


# ======================================
# GET EMPLOYEES
# ======================================

print("\nConnecting to backend...")


try:

    response = requests.get(
        BACKEND_URL,
        timeout=10
    )

    print(
        "Backend status:",
        response.status_code
    )

except Exception as error:

    print("\nBackend connection failed!")

    print(
        type(error).__name__,
        ":",
        error
    )

    print(
        "\nMake sure backend is running on port 5000."
    )

    exit()


if response.status_code != 200:

    print(
        "Backend returned:",
        response.text
    )

    exit()


employees = response.json()


print(
    "Employees found:",
    len(employees)
)


# ======================================
# FIND EMPLOYEE
# ======================================

employee = next(
    (
        emp
        for emp in employees
        if emp.get("employeeId") == EMPLOYEE_ID
    ),
    None
)


if employee is None:

    print(
        f"\nEmployee {EMPLOYEE_ID} not found!"
    )

    print("\nAvailable employees:")

    for emp in employees:

        print(
            emp.get("employeeId"),
            "-",
            emp.get("name")
        )

    exit()


print("\nEmployee:")
print(
    employee["employeeId"],
    "-",
    employee["name"]
)


# ======================================
# CAMERA
# ======================================

print("\nOpening camera...")


cap = cv2.VideoCapture(0)


if not cap.isOpened():

    print(
        "Camera 0 open nahi hua."
    )

    cap.release()

    # Try camera 1
    cap = cv2.VideoCapture(1)


if not cap.isOpened():

    print(
        "Camera 1 bhi open nahi hua."
    )

    print(
        "Camera available nahi hai."
    )

    exit()


print("Camera started.")


# ======================================
# REGISTRATION
# ======================================

print("\n======================================")
print("INSTRUCTIONS")
print("======================================")

print(
    "SPACE = Capture sample"
)

print(
    "Q = Exit"
)

print(
    f"\nRequired samples: {TOTAL_SAMPLES}"
)


embeddings = []

sample_number = 0


# ======================================
# CAMERA LOOP
# ======================================

while True:

    ret, frame = cap.read()


    if not ret:

        print(
            "Camera frame nahi mila."
        )

        break


    # ----------------------------------
    # UI
    # ----------------------------------

    cv2.putText(

        frame,

        f"Samples: {sample_number}/{TOTAL_SAMPLES}",

        (20, 40),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.8,

        (0, 255, 0),

        2

    )


    cv2.putText(

        frame,

        "SPACE = Capture | Q = Exit",

        (20, 75),

        cv2.FONT_HERSHEY_SIMPLEX,

        0.65,

        (0, 255, 255),

        2

    )


    cv2.imshow(
        "Face Registration",
        frame
    )


    key = cv2.waitKey(1) & 0xFF


    # ----------------------------------
    # EXIT
    # ----------------------------------

    if key == ord("q"):

        print(
            "\nRegistration cancelled."
        )

        break


    # ----------------------------------
    # CAPTURE
    # ----------------------------------

    if key == 32:

        print(
            f"\nCapturing "
            f"{sample_number + 1}/{TOTAL_SAMPLES}..."
        )


        try:

            results = DeepFace.represent(

                img_path=frame,

                model_name="Facenet512",

                detector_backend="opencv",

                enforce_detection=True

            )


            # No face
            if len(results) == 0:

                print(
                    "Face detect nahi hua."
                )

                continue


            # Multiple faces
            if len(results) > 1:

                print(
                    "Multiple faces detected!"
                )

                print(
                    "Sirf ek person camera ke saamne rakho."
                )

                continue


            embedding = results[0]["embedding"]


            # ----------------------------------
            # SAVE SAMPLE
            # ----------------------------------

            embeddings.append(
                embedding
            )

            sample_number += 1


            print(
                f"SUCCESS "
                f"{sample_number}/{TOTAL_SAMPLES}"
            )


            time.sleep(0.4)


            # ----------------------------------
            # ALL SAMPLES
            # ----------------------------------

            if sample_number == TOTAL_SAMPLES:

                print(
                    "\nAll samples captured."
                )

                print(
                    "Saving embeddings to MongoDB..."
                )


                update_url = (
                    f"{BACKEND_URL}/{employee['_id']}"
                )


                update_response = requests.put(

                    update_url,

                    json={
                        "faceEncodings": embeddings
                    },

                    timeout=30

                )


                print(
                    "Update status:",
                    update_response.status_code
                )


                if update_response.status_code == 200:

                    print()
                    print(
                        "======================================"
                    )

                    print(
                        "FACE REGISTRATION SUCCESSFUL"
                    )

                    print(
                        "Employee:",
                        employee["name"]
                    )

                    print(
                        "Samples saved:",
                        len(embeddings)
                    )

                    print(
                        "======================================"
                    )

                else:

                    print(
                        "MongoDB update failed:"
                    )

                    print(
                        update_response.text
                    )


                break


        except Exception as error:

            print(
                "\nFace processing error:"
            )

            print(
                type(error).__name__,
                ":",
                error
            )


# ======================================
# CLEANUP
# ======================================

cap.release()

cv2.destroyAllWindows()


print(
    "\nRegistration process finished."
)