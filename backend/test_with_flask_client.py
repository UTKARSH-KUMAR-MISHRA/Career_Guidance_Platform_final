# backend/test_with_flask_client.py
import os
import json
from app import app

def run_flask_client_tests():
    print("=" * 60)
    print("🧪 TESTING ALL ENDPOINTS VIA FLASK TEST CLIENT")
    print("=" * 60)
    client = app.test_client()

    # 1. Health check
    res = client.get("/api/health")
    print("\n[TEST 1] GET /api/health")
    print("Status:", res.status_code, "JSON:", res.get_json())
    assert res.status_code == 200 and res.get_json()["status"] == "ok"

    # 2. RAG Ask endpoint
    print("\n[TEST 2] POST /api/v1/ask")
    res = client.post("/api/v1/ask", json={"question": "What does an AI Engineer do in India?"})
    print("Status:", res.status_code)
    data = res.get_json()
    print("Out of scope:", data.get("out_of_scope"))
    print("Citations:", len(data.get("citations", [])))
    print("Answer snippet:", data.get("answer", "")[:250])
    assert res.status_code == 200 and not data.get("out_of_scope")

    # 3. Chat History endpoints
    print("\n[TEST 3] GET /api/history")
    res = client.get("/api/history")
    print("Status:", res.status_code, "Items:", len(res.get_json()))
    assert res.status_code == 200

    # 4. OCR Upload endpoint
    print("\n[TEST 4] POST /api/v1/ocr-chat")
    with open("/tmp/resume_test.png", "rb") as img:
        data = {
            "file": (img, "resume_test.png"),
            "question": "What key skills should I learn next based on this resume?"
        }
        res = client.post("/api/v1/ocr-chat", data=data, content_type="multipart/form-data")
        print("Status:", res.status_code)
        ocr_resp = res.get_json()
        print("Extracted OCR text:", ocr_resp.get("extracted_text"))
        print("Image URL:", ocr_resp.get("image_url"))
        print("AI Guidance snippet:", ocr_resp.get("answer", "")[:250])
        assert res.status_code == 200

    # 5. Roadmap HTML static route
    print("\n[TEST 5] GET /roadmaps/software-engineer-roadmap.html")
    res = client.get("/roadmaps/software-engineer-roadmap.html")
    print("Status:", res.status_code, "Content length:", len(res.data))
    assert res.status_code == 200

    print("\n🎉 ALL 5 ENDPOINT TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_flask_client_tests()
