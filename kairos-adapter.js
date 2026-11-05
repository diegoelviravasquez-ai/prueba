// kairos-adapter.js — Adaptador de facilitación KAIRÓS (capa "leer", inglés)
// =============================================================================
// Qué hace (y qué NO hace):
//   SÍ: toma la medición de prosodia que produce eco-dsp.js (κ + biomarcadores),
//       LOCALIZA la barrera (en qué dimensión se cae), ELIGE un andamio del banco
//       fijo, y emite el estado declarativo {foco, capa, disposicion, kappa,
//       barrier, andamio} que la piel KAIRÓS pinta. El andamio se RETIRA al
//       dominar (fade 3→0) y REAPARECE si recae (restitución).
//   NO: no genera texto libre, no infiere el estado del niño (lo DECLARA él:
//       autoinforme), no hace ASR ni scoring fonético fino (eso es hoja de ruta),
//       no llama a ninguna red. Clasifica, no genera. Offline, 4 ceros intactos.
//
// Contrato motor→piel (lo que consume KAIRÓS):
//   { foco, capa:"leer", disposicion, kappa, barrier, andamio, retired }
//
// Convención: identificadores en inglés, comentarios en español.
// =============================================================================

import { scaffoldFor, SCAFFOLD_NONE } from "./scaffold-bank.js";

// Mapa biomarcador -> dimensión de barrera (nombres del banco de andamios).
const FEATURE_TO_DIMENSION = {
  nPVI_V: "ritmo",
  pctV: "cadencia",
  deltaF0: "melodia",
  fluency: "fluidez"
};

// Cuánto tiene que subir κ respecto al intento anterior para bajar un nivel de
// andamio (desvanecer). Y cuánto puede bajar antes de restituir (volver a subir).
const FADE_GAIN = 6;        // κ sube ≥ 6 pts -> andamio -1 (más autonomía)
const RELAPSE_DROP = 8;     // κ baja ≥ 8 pts -> andamio +1 (restitución)

// --- 1 · Localizar la barrera ------------------------------------------------
// Compara cada biomarcador con su franja esperada (la línea base del propio niño
// en producción; aquí, la 'band' del item). Devuelve la dimensión con el déficit
// relativo mayor. Si κ ya está dentro de franja, no hay barrera.
export function localizeBarrier(measurement, target) {
  const band = target.band || {};
  // ¿κ global ya en franja? -> sin barrera.
  if (inBand(measurement.kappa, band.kappa)) {
    return { dimension: null, severity: 0, detail: "κ en franja; sin barrera." };
  }
  let worst = { dimension: "fluidez", severity: 0, detail: "" };
  for (const feature of Object.keys(FEATURE_TO_DIMENSION)) {
    const value = measurement[feature];
    const range = band[feature];
    if (value == null || !range) continue;
    const deficit = relativeDeficit(value, range); // 0 (en franja) .. 1 (muy fuera)
    if (deficit > worst.severity) {
      worst = {
        dimension: FEATURE_TO_DIMENSION[feature],
        severity: round2(deficit),
        detail: `${feature}=${value} fuera de [${range[0]}, ${range[1]}]`
      };
    }
  }
  return worst;
}

// --- 2 · Estado de intentos (fade / restitución) -----------------------------
// La piel guarda un objeto attemptState por (niño, item). Es puro dato.
export function initAttemptState() {
  return { attempts: 0, lastKappa: null, scaffoldLevel: 3, dimension: null, history: [] };
}

// Dado el nivel previo y el cambio de κ, decide el nuevo nivel de andamio.
function nextScaffoldLevel(state, kappa, dimension) {
  // Primer intento con barrera: arranca alto.
  if (state.lastKappa == null) return state.scaffoldLevel;
  // Si cambia la dimensión de la barrera, reinicia la escalera de esa dimensión.
  if (dimension && dimension !== state.dimension) return 3;
  const delta = kappa - state.lastKappa;
  if (delta >= FADE_GAIN) return Math.max(0, state.scaffoldLevel - 1);   // desvanecer
  if (delta <= -RELAPSE_DROP) return Math.min(3, state.scaffoldLevel + 1); // restituir
  return state.scaffoldLevel; // sin cambio relevante
}

// --- 3 · Facilitar (entrada principal que llama la piel) ---------------------
// inputs:
//   measurement : {kappa, nPVI_V, pctV, deltaF0, fluency}  (de eco-dsp.js)
//   target      : un item de content/phonetic-targets.json
//   disposicion : estado DECLARADO por el niño ("ok" | "cansado" | ...), nunca inferido
//   foco        : qué quiere hacer hoy (entrada circunstancial); se arrastra tal cual
//   state       : attemptState (se devuelve actualizado)
// returns: { contract, state }  — contract = lo que pinta KAIRÓS
export function facilitate({ measurement, target, disposicion = "ok", foco = "", state }) {
  const st = state || initAttemptState();
  const barrier = localizeBarrier(measurement, target);

  // Sin barrera: κ en franja -> andamio retirado, se celebra el dominio.
  if (!barrier.dimension) {
    const contract = emit({ foco, disposicion, kappa: measurement.kappa, barrier, andamio: { ...SCAFFOLD_NONE }, retired: true, target });
    const nst = { ...st, attempts: st.attempts + 1, lastKappa: measurement.kappa, scaffoldLevel: 0, dimension: null,
      history: [...st.history, snap(measurement.kappa, 0, null)] };
    return { contract, state: nst };
  }

  // Con barrera: calcula nivel (fade/restitución) y elige el andamio del banco.
  const level = nextScaffoldLevel(st, measurement.kappa, barrier.dimension);
  const move = scaffoldFor(barrier.dimension, level);
  // Si el andamio usa audio, apunta al fichero LOCAL del item (nunca a la nube).
  const andamio = { ...move, dimension: barrier.dimension,
    audio: move.usesAudio ? target.audio : null };

  const contract = emit({ foco, disposicion, kappa: measurement.kappa, barrier, andamio, retired: level <= 0, target });
  const nst = {
    attempts: st.attempts + 1,
    lastKappa: measurement.kappa,
    scaffoldLevel: level,
    dimension: barrier.dimension,
    history: [...st.history, snap(measurement.kappa, level, barrier.dimension)]
  };
  return { contract, state: nst };
}

// --- helpers -----------------------------------------------------------------
function emit({ foco, disposicion, kappa, barrier, andamio, retired, target }) {
  // El estado declarativo. La piel decide cómo lo pinta. No da el resultado:
  // ofrece una TAREA (andamio) para que el niño produzca y razone.
  return {
    item: target.id,
    text: target.text,
    foco,
    capa: "leer",
    disposicion,              // DECLARADO por el niño, no inferido
    kappa: round2(kappa),
    barrier,                  // {dimension, severity, detail}
    andamio,                  // {level, kind, instruction, audio, dimension}
    retired,                  // true => ya puede solo
    givesAnswer: false        // invariante: nunca damos el resultado
  };
}

function inBand(v, range) { return v != null && range && v >= range[0] && v <= range[1]; }

// Déficit relativo: 0 si está dentro; crece según se aleja por debajo (o encima)
// de la franja, normalizado por el ancho de la franja. Acotado a [0,1].
function relativeDeficit(v, [lo, hi]) {
  if (v >= lo && v <= hi) return 0;
  const width = Math.max(1, hi - lo);
  const dist = v < lo ? lo - v : v - hi;
  return Math.min(1, dist / width);
}

function snap(kappa, level, dimension) { return { kappa: round2(kappa), level, dimension }; }
function round2(x) { return Math.round(x * 100) / 100; }
