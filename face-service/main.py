
import base64
import cv2
import numpy as np
import requests

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from deepface import DeepFace
from recognize_face import recognize_frame

import os

app = FastAPI(title="Face Attendance AI Service")

BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://localhost:5000/api"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", "")
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registration Request
class FaceRegistrationRequest(BaseModel):
    employeeId: str
    images: list[str]


# Recognition Request
class RecognitionRequest(BaseModel):
    image: str


# Home
@app.get("/")
def home():
    return {
        "message": "Face AI Service is running",
        "status": "success"
    }


# Health
@app.get("/health")
def health():
    return {"status": "healthy"}


# Face Registration
@app.post("/register-face")
def register_face(data: FaceRegistrationRequest):

    if len(data.images) != 15:
        raise HTTPException(
            status_code=400,
            detail="Exactly 15 samples are required."
        )

    try:
        response = requests.get(
            f"{BACKEND_URL}/employees",
            timeout=15
        )
        response.raise_for_status()
        employees = response.json()

    except requests.RequestException as error:
        raise HTTPException(
            status_code=503,
            detail=f"Backend connection failed: {error}"
        )

    employee = next(
        (
            item for item in employees
            if item.get("employeeId") == data.employeeId
        ),
        None
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found."
        )

    embeddings = []
    failed_samples = []

    for index, image_data in enumerate(data.images):

        try:
            if "," in image_data:
                image_data = image_data.split(",", 1)[1]

            image_bytes = base64.b64decode(image_data)

            image_array = np.frombuffer(
                image_bytes,
                dtype=np.uint8
            )

            frame = cv2.imdecode(
                image_array,
                cv2.IMREAD_COLOR
            )

            if frame is None:
                raise ValueError("Invalid image")

            representations = DeepFace.represent(
                img_path=frame,
                model_name="Facenet512",
                detector_backend="opencv",
                enforce_detection=True,
                align=True
            )

            if len(representations) != 1:
                raise ValueError("Exactly one face is required")

            embedding = representations[0]["embedding"]

            if len(embedding) != 512:
                raise ValueError("Invalid embedding dimensions")

            embeddings.append(embedding)

        except Exception as error:
            failed_samples.append({
                "sample": index + 1,
                "reason": str(error)
            })

            print(f"Sample {index + 1} skipped: {error}")

    if len(embeddings) < 10:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Not enough valid face samples.",
                "validSamples": len(embeddings),
                "failedSamples": failed_samples
            }
        )

    try:
        save_response = requests.put(
            f"{BACKEND_URL}/employees/{employee['_id']}",
            json={"faceEncodings": embeddings},
            timeout=60
        )

        save_response.raise_for_status()

    except requests.RequestException as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save face data: {error}"
        )

    return {
        "status": "success",
        "message": "Face registered successfully",
        "employeeId": data.employeeId,
        "samples": len(embeddings),
        "failedSamples": failed_samples,
        "embeddingDimensions": 512
    }


# Live Face Recognition
@app.post("/recognize")
def recognize(data: RecognitionRequest):

    try:
        image_data = data.image

        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)

        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        if frame is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid camera image."
            )

        result = recognize_frame(frame)

        return result

    except HTTPException:
        raise

    except Exception as error:
        print("Recognition Error:", error)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
