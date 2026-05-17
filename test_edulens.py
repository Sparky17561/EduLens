import subprocess
import requests
import json
import time
import sys
import os

GGUF_PATH = "edulens-f16.gguf"   # relative to EduLens root
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "edulens"

# ── Step 1: Create Modelfile ─────────────────────────────────────────────────
modelfile = f"""FROM {GGUF_PATH}
SYSTEM You are EduLens, a patient AI tutor for Class 6-10 students in India. You follow the NCERT curriculum. Always reason step-by-step before answering. Use simple language appropriate for school students.
"""

with open("Modelfile", "w") as f:
    f.write(modelfile)
print("✓ Modelfile created")

# ── Step 2: Check Ollama is running ─────────────────────────────────────────
try:
    r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
    print(f"✓ Ollama is running (status {r.status_code})")
except Exception as e:
    print(f"✗ Ollama not reachable at {OLLAMA_URL}")
    print(f"  Start it with: ollama serve")
    sys.exit(1)

# ── Step 3: Load model into Ollama ──────────────────────────────────────────
print(f"\nLoading model into Ollama as '{MODEL_NAME}'...")
print("(This may take a few minutes for a large GGUF file)\n")

result = subprocess.run(
    ["ollama", "create", MODEL_NAME, "-f", "Modelfile"],
    capture_output=True, text=True
)

if result.returncode != 0:
    print("✗ Error loading model:")
    print(result.stderr)
    sys.exit(1)

print("✓ Model loaded!\n")

# ── Step 4: Test queries ─────────────────────────────────────────────────────
TEST_QUESTIONS = [
    "What is photosynthesis? Explain for Class 7.",
    "A train travels 120 km in 2 hours. What is its speed in m/s?",
    "Why does ice float on water?",
    "What is Newton's second law of motion?",
    "What causes seasons on Earth?",
]

print("=" * 60)
print("EDULENS MODEL TEST")
print("=" * 60)

all_passed = True
for i, question in enumerate(TEST_QUESTIONS):
    print(f"\n[Q{i+1}] {question}")
    print("-" * 40)

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": MODEL_NAME,
                "prompt": question,
                "stream": False,
            },
            timeout=120
        )

        if response.status_code == 200:
            answer = response.json()["response"]
            print(answer[:600])
            word_count = len(answer.split())
            print(f"\n[Length: {word_count} words]")
            if word_count < 5:
                print("⚠ Warning: Very short response")
                all_passed = False
        else:
            print(f"✗ Error: HTTP {response.status_code}")
            print(response.text[:200])
            all_passed = False

    except requests.Timeout:
        print("✗ Timeout — model may be too slow on this hardware")
        all_passed = False
    except Exception as e:
        print(f"✗ Exception: {e}")
        all_passed = False

    time.sleep(1)

print("\n" + "=" * 60)
if all_passed:
    print("✓ All tests passed! Model is working correctly.")
    print(f"\nNext step: The EduLens backend will use '{MODEL_NAME}' via Ollama.")
    print("Set OLLAMA_MODEL=edulens in your .env file.")
else:
    print("⚠ Some tests failed. Check Ollama logs.")
print("=" * 60)
