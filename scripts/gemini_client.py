"""Reusable Gemini client with key rotation and retry on rate-limit errors.

Import from your app:

    from scripts.gemini_client import generate

    text = generate("Hello!", model="gemini-2.5-flash")
"""

from __future__ import annotations

import itertools
import os
import time
from typing import Iterable

from dotenv import load_dotenv
from google import genai
from google.genai import errors as genai_errors

load_dotenv()


def _load_keys() -> list[str]:
    keys = [
        os.environ.get("GEMINI_API_KEY"),
        os.environ.get("GEMINI_API_KEY_2"),
        os.environ.get("GEMINI_API_KEY_3"),
        os.environ.get("GEMINI_API_KEY_4"),
    ]
    keys = [k for k in keys if k]
    if not keys:
        raise RuntimeError(
            "No Gemini API keys found. Set GEMINI_API_KEY in .env or environment."
        )
    return keys


_KEYS = _load_keys()
_key_cycle = itertools.cycle(_KEYS)


def get_client() -> genai.Client:
    """Return a client bound to the next key in the rotation."""
    return genai.Client(api_key=next(_key_cycle))


def generate(
    prompt: str,
    model: str = "gemini-3-flash-preview",
    max_retries: int | None = None,
) -> str:
    """Generate text, rotating keys when one is rate-limited.

    Tries each key once; if all fail with 429, raises the last error.
    """
    attempts = max_retries if max_retries is not None else len(_KEYS)
    last_error: Exception | None = None

    for _ in range(attempts):
        client = get_client()
        try:
            response = client.models.generate_content(model=model, contents=prompt)
            return response.text or ""
        except genai_errors.ClientError as exc:
            # 429 = rate limit; rotate to next key
            if getattr(exc, "code", None) == 429:
                last_error = exc
                time.sleep(0.5)
                continue
            raise

    assert last_error is not None
    raise last_error


def generate_many(prompts: Iterable[str], model: str = "gemini-3-flash-preview") -> list[str]:
    """Sequentially generate for many prompts, naturally spreading load across keys."""
    return [generate(p, model=model) for p in prompts]


if __name__ == "__main__":
    print(f"Loaded {len(_KEYS)} key(s).")
    print(generate("Say hi in Korean in one short sentence."))
