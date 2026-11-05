// Prueba de lógica: adaptador (bucle) + analizador local (con señal sintética).
import { readFileSync } from "node:fs";
import { facilitate, initAttemptState } from "./kairos-reader/kairos-adapter.js";
import { analyze as localAnalyze } from "./kairos-reader/engine/local-prosody.js";

const { targets } = JSON.parse(readFileSync(new URL("./kairos-reader/content/phonetic-targets.json", import.meta.url)));
const target = targets.find(t => t.id === "water");

// ---- 1 · adaptador: bucle con medición simulada ascendente ----
let state = initAttemptState(); let retiredAt = null;
const seq = [52, 61, 52, 63, 71, 78];
seq.forEach((k, i) => {
  const m = { kappa: k, nPVI_V: 42 + i * 3, pctV: 44, deltaF0: 60 + i, fluency: 68 + i * 2 };
  const { contract, state: ns } = facilitate({ measurement: m, target, disposicion: "ok", foco: "x", state });
  state = ns;
  if (contract.retired && retiredAt === null) retiredAt = i;
  const ok = contract.givesAnswer === false;
  console.log(`  intento ${i + 1} κ=${contract.kappa} barrera=${contract.barrier.dimension || "—"} andamio=${contract.andamio.level} retired=${contract.retired} givesAnswer=${contract.givesAnswer}`);
  if (!ok) throw new Error("INVARIANTE ROTA: givesAnswer debe ser false");
});
console.log(retiredAt !== null ? `  ✓ adaptador: se retira el andamio (intento ${retiredAt + 1})` : "  ✗ adaptador: NO se retiró");

// ---- 2 · analizador local: señal sintética (tono con pausas) ----
const SR = 44100;
function fakeBuffer() {
  const dur = 2.0, n = Math.floor(SR * dur);
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    // 3 "sílabas" (ráfagas tonales) con pausas, f0 variable -> melodía
    const seg = Math.floor(t / 0.5);
    const voiced = (t % 0.5) < 0.32;
    const f0 = 180 + seg * 25;
    data[i] = voiced ? 0.5 * Math.sin(2 * Math.PI * f0 * t) * Math.exp(-2 * (t % 0.5)) : 0;
  }
  return { sampleRate: SR, getChannelData: () => data };
}
const m = localAnalyze(fakeBuffer());
console.log("  analizador local ->", JSON.stringify(m));
for (const k of ["kappa", "nPVI_V", "pctV", "deltaF0", "fluency"]) {
  const v = m[k];
  if (typeof v !== "number" || !isFinite(v) || v < 0 || v > 100) throw new Error(`MÉTRICA INVÁLIDA: ${k}=${v}`);
}
console.log("  ✓ analizador local: 5 métricas finitas en [0,100]");

// ---- 3 · analizador local: entrada vacía/silencio no rompe ----
const empty = localAnalyze({ sampleRate: SR, getChannelData: () => new Float32Array(100) });
console.log("  silencio ->", JSON.stringify(empty), "✓ sin crash");

console.log("\nTODO OK");
