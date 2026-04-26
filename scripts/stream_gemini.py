"""Streaming response example.

Usage:
    python scripts/stream_gemini.py "Tell me a short story about a robot."
"""

import sys

from dotenv import load_dotenv
from google import genai

load_dotenv()


def main() -> None:
    prompt = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "Write a one-paragraph story about a hackathon team."
    )

    client = genai.Client()
    stream = client.models.generate_content_stream(
        model="gemini-3-flash-preview",
        contents=prompt,
    )
    for chunk in stream:
        if chunk.text:
            print(chunk.text, end="", flush=True)
    print()


if __name__ == "__main__":
    main()
