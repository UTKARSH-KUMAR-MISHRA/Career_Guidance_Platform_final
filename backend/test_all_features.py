# backend/test_all_features.py
import requests
import json
import time

BASE = "http://127.0.0.1:5000"

def test_features():
    print("=" * 60)
    print("🧪 TESTING ALL SYSTEM FEATURES & ENDPOINTS")
    print("=" * 60)

    # 1. Health check
    res = requests.get(f"{BASE}/api/health")
    print("[TEST 1] Health:", res.status_code, res.json())
    assert res.status_code == 200

    # 2. RAG query
    print("\n[TEST 2] RAG Ask endpoint:")
    res = requests.post(f"{BASE}/api/v1/ask", json={"question": "What is the 60-day roadmap to become an AI Engineer?"})
    print("Status:", res.status_code)
    data = res.json()
    print("Out of scope:", data.get("out_of_scope"))
    print("Citations:", len(data.get("citations", [])))
    print("Answer snippet:", data.get("answer", "")[:200])
    assert res.status_code == 200 and not data.get("out_of_scope")

    # 3. Chat History endpoints
    print("\n[TEST 3] Chat History GET:")
    res = requests.get(f"{BASE}/api/history")
    print("Status:", res.status_code)
    history = res.json()
    print("History items count:", len(history))

    # 4. OCR Chat Upload endpoint
    print("\n[TEST 4] OCR Chat upload endpoint:")
    files = {"file": ("test_resume.png", open("/tmp/resume_test.png", "rb"), "image/png")}
    form = {"question": "Based on my resume skills extracted, what entry level job should I apply for?"}
    res = requests.post(f"{BASE}/api/v1/ocr-chat", files=files, data=form)
    print("Status:", res.status_code)
    ocr_data = res.json()
    print("Extracted OCR text:", ocr_data.get("extracted_text"))
    print("Image URL:", ocr_data.get("image_url"))
    print("AI Guidance snippet:", ocr_data.get("answer", "")[:200])
    assert res.status_code == 200

    # 5. Roadmap HTML asset serving
    print("\n[TEST 5] Testing Roadmap HTML file serving:")
    res = requests.get(f"{BASE}/roadmaps/software-engineer-roadmap.html")
    print("Status:", res.status_code, "Length:", len(res.text))
    assert res.status_code == 200 and "<html" in res.text.lower()

    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_features()
