// prebuild-audio.mjs — GENERA los clips de voz de referencia UNA VEZ, en tu
// máquina, ANTES del hackathon. En ejecución la app NO llama a la nube: reproduce
// estos ficheros locales. Así KAIRÓS mantiene los 4 ceros (cero nube en runtime).
//
//   node prebuild-audio.mjs
//
// REQUISITOS DE SEGURIDAD (innegociables):
//   · La clave va en una variable de entorno, NUNCA escrita en el código ni
//     subida a GitHub:  export ELEVENLABS_API_KEY=xxxxx   (o en el .env del nodo)
//   · .gitignore YA bloquea /audio/*.mp3 y .env. No subas ni los mp3 ni la clave.
//   · Si esta clave ha estado alguna vez expuesta (chat, captura, repo), RÓTALA
//     en elevenlabs.io antes de usarla.
//   · Para el producto real, sustituye esto por un TTS LOCAL en el nodo (p. ej.
//     Piper) y no dependerás de ningún servicio en la nube ni siquiera en build.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // voz por defecto; cámbiala
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";

if (!API_KEY) {
  console.error("Falta ELEVENLABS_API_KEY en el entorno. No se genera nada. (Y nunca la pongas en el código.)");
  process.exit(1);
}

const { targets } = JSON.parse(readFileSync(new URL("./content/phonetic-targets.json", import.meta.url)));

for (const t of targets) {
  const outPath = new URL(`./${t.audio}`, import.meta.url);
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({
        text: t.text,
        model_id: MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });
    if (!res.ok) { console.error(`  ✗ ${t.id}: HTTP ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(outPath.pathname), { recursive: true });
    writeFileSync(outPath, buf);
    console.log(`  ✓ ${t.id} → ${t.audio} (${buf.length} bytes)`);
  } catch (e) {
    console.error(`  ✗ ${t.id}: ${e.message}`);
  }
}

console.log("\nListo. Los mp3 están en /audio (locales). La app los reproduce sin red.");
console.log("Recuerda: NO subas /audio ni el .env al repo público.");
