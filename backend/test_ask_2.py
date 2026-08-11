import requests
import json

url = "http://127.0.0.1:5000/api/v1/ask"
payload = {"question": "what are carrer differnce between AI and ML", "language": "en"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers, timeout=60)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
