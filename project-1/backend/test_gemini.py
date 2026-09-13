import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("GOOGLE_API_KEY", "").strip("[]'\"")

# List available models
list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
try:
    with urllib.request.urlopen(list_url) as resp:
        data = json.loads(resp.read().decode())
        print("Available Models:")
        for m in data.get("models", []):
            if "generateContent" in m.get("supportedGenerationMethods", []):
                print(f"- {m['name']}")
except Exception as e:
    print(f"Error listing models: {e}")
