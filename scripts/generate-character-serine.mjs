#!/usr/bin/env node
/**
 * Generate Serine character illustration via Gemini Nano Banana (gemini-2.5-flash-image).
 * Tries 4 GEMINI keys with rotation. Writes to public/assets/character-serine.png.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadDotenv() {
  for (const name of [".env.local", ".env"]) {
    const p = join(ROOT, name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m) continue;
      const k = m[1];
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadDotenv();

const KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter((k) => k && k.trim().length > 0);

if (KEYS.length === 0) {
  console.error("no GEMINI_API_KEY found in env");
  process.exit(1);
}

const PROMPT = `A gentle, warm, illustrated character mascot named Serine for a Korean mobile app called ohmyc.
Style: soft hand-drawn cartoon, clean lines, Apple HIG aesthetic, Studio Ghibli warmth, cozy.
Look: young person of ambiguous gender, kind soft smile, calm caring expression, looking slightly toward viewer.
Outfit: simple cozy beige cream cardigan over a soft white shirt, comfortable look.
Color palette: warm apricot accents (#FF8552 hex), soft cream background, gentle peach highlights, no harsh saturation.
Composition: single full-body chibi-proportion character, centered, standing slightly forward, hands relaxed at sides or one hand softly raised in greeting.
Background: pure clean off-white background, no scenery, no text, no logos.
The character should feel like a trustworthy gentle friend who remembers your promises — warm presence, not a butler or assistant.
Output: a single high-quality illustration, square, suitable as a mobile app character avatar shown at large size.`;

async function generateOnce(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: PROMPT }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.inlineData?.data) {
      return { mime: p.inlineData.mimeType || "image/png", data: p.inlineData.data };
    }
  }
  throw new Error(`no inline image in response: ${JSON.stringify(json).slice(0, 500)}`);
}

async function main() {
  const outDir = join(ROOT, "public", "assets");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "character-serine.png");

  let lastErr = null;
  for (let i = 0; i < KEYS.length; i++) {
    const key = KEYS[i];
    console.log(`[try ${i + 1}/${KEYS.length}] key=${key.slice(0, 6)}…`);
    try {
      const { data } = await generateOnce(key);
      const buf = Buffer.from(data, "base64");
      writeFileSync(outPath, buf);
      console.log(`wrote ${outPath} (${buf.length} bytes)`);
      return;
    } catch (e) {
      lastErr = e;
      console.error(`  failed: ${e.message}`);
    }
  }
  throw lastErr ?? new Error("all keys failed");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(2);
});
