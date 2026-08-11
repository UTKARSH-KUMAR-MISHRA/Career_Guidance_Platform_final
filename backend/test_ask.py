import requests
import json

url = "http://127.0.0.1:5000/api/v1/ask"
payload = {"question": "What are the core skills required for AI Engineer?", "language": "en"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
