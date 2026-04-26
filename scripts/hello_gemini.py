"""Minimal Gemini API smoke test.

Usage:
    python scripts/hello_gemini.py
    python scripts/hello_gemini.py "your prompt here"
"""

import sys

from dotenv import load_dotenv
from google import genai

load_dotenv()


def main() -> None:
    prompt = sys.argv[1] if len(sys.argv) > 1 else "Explain how AI works in a few words"

    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
    )
    print(response.text)


if __name__ == "__main__":
    main()
