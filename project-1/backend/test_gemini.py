import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GOOGLE_API_KEY", "").strip("[]'\"")

import base64
dummy_pdf = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF"
b64 = base64.b64encode(dummy_pdf).decode("utf-8")

test_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={key}"
body = json.dumps({
    "contents": [{
        "parts": [
            {"inlineData": {"mimeType": "application/pdf", "data": b64}},
            {"text": "Analyze this PDF"}
        ]
    }]
}).encode("utf-8")
req = urllib.request.Request(test_url, data=body, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as resp:
        print("INLINEDATA SUCCESS:", resp.status)
        print(resp.read().decode()[:200])
except urllib.error.HTTPError as e:
    print(f"HTTP ERROR {e.code}: {e.read().decode()[:250]}")
except Exception as e:
    print(f"ERROR: {e}")
