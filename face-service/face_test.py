import cv2
from deepface import DeepFace

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Camera open nahi ho raha")
    exit()

print("Camera started...")
print("Q press karke exit karo")

while True:
    ret, frame = cap.read()

    if not ret:
        print("Camera frame nahi mil raha")
        break

    try:
        results = DeepFace.extract_faces(
            img_path=frame,
            detector_backend="opencv",
            enforce_detection=False
        )

        for result in results:
            facial_area = result["facial_area"]

            x = facial_area["x"]
            y = facial_area["y"]
            w = facial_area["w"]
            h = facial_area["h"]

            cv2.rectangle(
                frame,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                2
            )

            cv2.putText(
                frame,
                "Face Detected",
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2
            )

    except Exception as e:
        print("Face detection error:", e)

    cv2.imshow("Face Detection Test", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()