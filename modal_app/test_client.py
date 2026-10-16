import base64
import requests
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env.local
root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / ".env.local"

# Load the variables from .env.local into os.environ
load_dotenv(env_path)
modal_url = os.getenv("MODAL_BIO_CLIP_URL")

# Test with a local image (the image is an air potato)
IMAGE_PATH = ".\\public\\slides\\slide-2.jpg"

with open(IMAGE_PATH, "rb") as f:
    b64_str = base64.b64encode(f.read()).decode("utf-8")

payload = {"image": f"data:image/jpeg;base64,{b64_str}"}

print("Sending request to Modal...")
response = requests.post(modal_url, json=payload)
print("Status Code:", response.status_code)
print("Result:\n", response.json())