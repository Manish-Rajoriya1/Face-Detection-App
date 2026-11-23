
import requests
import numpy as np
import time

from deepface import DeepFace



# Employee cache
EMPLOYEE_CACHE = []
CACHE_TIME = 0
CACHE_DURATION = 30


BACKEND_URL = "http://localhost:5000/api"

MODEL_NAME = "Facenet512"
DETECTOR_BACKEND = "opencv"

# Initial strict matching settings.
# We will calibrate these using your actual camera results.
DISTANCE_THRESHOLD = 0.105
MIN_MARGIN = 0.025


def cosine_distance(embedding1, embedding2):
    embedding1 = np.asarray(embedding1, dtype=np.float32)
    embedding2 = np.asarray(embedding2, dtype=np.float32)

    norm1 = np.linalg.norm(embedding1)
    norm2 = np.linalg.norm(embedding2)

    if norm1 == 0 or norm2 == 0:
        return 1.0

    similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)

    return float(1.0 - similarity)


def get_employees():
    global EMPLOYEE_CACHE, CACHE_TIME

    current_time = time.time()

    # Use cached employees for 30 seconds
    if (
        EMPLOYEE_CACHE
        and current_time - CACHE_TIME < CACHE_DURATION
    ):
        return EMPLOYEE_CACHE

    response = requests.get(
        f"{BACKEND_URL}/employees",
        timeout=15
    )

    response.raise_for_status()

    employees = response.json()

    if not isinstance(employees, list):
        raise ValueError("Unexpected employee API response")

    EMPLOYEE_CACHE = employees
    CACHE_TIME = current_time

    return EMPLOYEE_CACHE


def recognize_frame(frame):
    """
    Receives one OpenCV BGR frame.
    Returns recognized employee or Unknown.
    """

    # Detect face and generate embedding
    try:
        representations = DeepFace.represent(
        img_path=frame,
        model_name=MODEL_NAME,
        detector_backend=DETECTOR_BACKEND,
        enforce_detection=True,
        align=True
    )
    except Exception:
        return {
            "recognized": False,
            "status": "unknown",
            "message": "No clear face detected."
    }

    if len(representations) != 1:
        return {
            "recognized": False,
            "status": "unknown",
            "message": "Please keep exactly one face in the camera."
        }

    query_embedding = representations[0]["embedding"]

    # Get registered employees and their face samples
    employees = get_employees()

    employee_scores = []

    for employee in employees:
        stored_embeddings = employee.get("faceEncodings", [])

        if not stored_embeddings:
            continue

        distances = []

        for stored_embedding in stored_embeddings:
            if len(stored_embedding) != 512:
                continue

            distance = cosine_distance(
                query_embedding,
                stored_embedding
            )

            distances.append(distance)

        if not distances:
            continue

        distances.sort()

        best_distance = distances[0]
        top_distances = distances[:3]
        top_average = float(np.mean(top_distances))

        combined_score = (
            0.70 * best_distance +
            0.30 * top_average
        )

        employee_scores.append({
            "employee": employee,
            "distance": combined_score
        })

    if not employee_scores:
        return {
            "recognized": False,
            "status": "unknown",
            "message": "No registered face samples found."
        }

    employee_scores.sort(
        key=lambda item: item["distance"]
    )

    best_match = employee_scores[0]
    best_distance = best_match["distance"]

    second_distance = (
        employee_scores[1]["distance"]
        if len(employee_scores) > 1
        else 1.0
    )

    margin = second_distance - best_distance

    is_match = (
        best_distance <= DISTANCE_THRESHOLD
        and margin >= MIN_MARGIN
    )

    if not is_match:
        return {
            "recognized": False,
            "status": "unknown",
            "distance": round(best_distance, 4),
            "margin": round(margin, 4),
            "message": "Face not confidently recognized."
        }

    employee = best_match["employee"]

    return {
        "recognized": True,
        "status": "recognized",
        "employee": {
            "id": employee.get("employeeId"),
            "name": employee.get("name"),
            "department": employee.get("department")
        },
        "distance": round(best_distance, 4),
        "margin": round(margin, 4),
        "message": "Employee recognized successfully."
    }
