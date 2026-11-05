// app.js — KAIRÓS Reader (piel). Pinta el contrato del adaptador. Offline, 4 ceros.
// El motor NO dibuja UI: emite {foco,capa,disposicion,kappa,barrier,andamio,retired}.
import { facilitate, initAttemptState } from "./kairos-adapter.js";
import { analyze as localAnalyze, reset as localReset } from "./engine/local-prosody.js";
import { analyze as stubAnalyze, reset as stubReset } from "./engine/eco-dsp-stub.js";

const params = new URLSearchParams(location.search);
const DEV = params.get("dev") === "1";
// Motor de medición: "local" (micro real) por defecto; "stub" para demo sin micro.
let ENGINE = params.get("engine") === "stub" ? "stub" : "local";
const RECORD_MS = 3500;

const S = {
  phase: "disposicion",      // disposicion | reading | recording | scaffold | retired | teacher
  disposicion: "ok",
  itemIndex: 0,
  targets: [],
  state: initAttemptState(),
  contract: null,
  micBlocked: false,
  history: []                // {item, kappa, level, dimension} acumulado (mapa vivo)
};

const screen = document.getElementById("screen");
const engineLabel = document.getElementById("engineLabel");

init();

async function init() {
  try {
    const res = await fetch("./content/phonetic-targets.json");
    S.targets = (await res.json()).targets;
  } catch (e) { S.targets = []; }
  setEngineLabel();
  wireHeader();
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function setEngineLabel() {
  engineLabel.textContent = ENGINE === "local"
    ? (S.micBlocked ? "demostración simulada (sin micro)" : "medición local (prototipo)")
    : "demostración simulada";
}

function target() { return S.targets[S.itemIndex] || { id: "demo", text: "water", band: {}, audio: null }; }

// -------- medición (elige motor; local = micro real) --------
async function measure() {
  if (ENGINE === "stub") return stubAnalyze();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise(r => (rec.onstop = r));
    rec.start();
    await wait(RECORD_MS);
    rec.stop();
    await stopped;
    stream.getTracks().forEach(t => t.stop());
    const buf = await new Blob(chunks).arrayBuffer();
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await ac.decodeAudioData(buf);
    ac.close && ac.close();
    S.micBlocked = false; setEngineLabel();
    return localAnalyze(audioBuffer);
  } catch (e) {
    // micro denegado o no disponible -> cae al stub, con etiqueta honesta
    S.micBlocked = true; setEngineLabel();
    return stubAnalyze();
  }
}

// -------- bucle --------
async function doRead() {
  S.phase = "recording"; render();
  const m = await measure();
  const out = facilitate({
    measurement: m, target: target(),
    disposicion: S.disposicion, foco: "leer en inglés", state: S.state
  });
  S.state = out.state; S.contract = out.contract;
  S.history.push({ item: target().id, kappa: out.contract.kappa,
                   level: out.contract.andamio.level, dimension: out.contract.barrier.dimension });
  S.phase = out.contract.retired ? "retired" : "scaffold";
  render();
}

function chooseDisposicion(d) { S.disposicion = d; S.phase = "reading"; render(); }

function nextItem() {
  S.itemIndex = (S.itemIndex + 1) % S.targets.length;
  S.state = initAttemptState(); S.contract = null;
  localReset(); stubReset();
  S.phase = "reading"; render();
}

// -------- render --------
function render() {
  if (S.phase === "teacher") return renderTeacher();
  if (S.phase === "disposicion") return renderDisposicion();
  if (S.phase === "retired") return renderRetired();
  if (S.phase === "recording") return renderRecording();
  if (S.phase === "scaffold") return renderScaffoldScreen();
  return renderReading();
}

function renderDisposicion() {
  screen.innerHTML = `
    <div class="card">
      <p class="lead">Antes de empezar</p>
      <h1 class="h1">¿Cómo estás hoy?</h1>
      <p class="meta">Tú lo dices. Nadie lo adivina.</p>
      <div class="disp">
        <button data-d="ok"><span class="emo">🙂</span>Con ganas</button>
        <button data-d="neutral"><span class="emo">😐</span>Normal</button>
        <button data-d="cansado"><span class="emo">😴</span>Cansado</button>
      </div>
    </div>`;
  screen.querySelectorAll(".disp button").forEach(b =>
    b.onclick = () => chooseDisposicion(b.dataset.d));
}

function renderReading() {
  const t = target();
  screen.innerHTML = `
    <div class="card">
      <p class="lead">Léelo en inglés</p>
      <p class="word">${t.text}</p>
      <p class="meta">Pulsa y lee en voz alta. Te escucho y te ayudo si te trabas.</p>
      <div class="actions">
        ${t.audio ? `<button class="play" id="play">► Escuchar el modelo</button>` : ``}
        <button class="rec" id="rec">● Léelo tú</button>
        ${DEV ? `<button class="ghost" id="sim">▶︎ simular</button>` : ``}
      </div>
    </div>`;
  if (t.audio) screen.querySelector("#play").onclick = () => playAudio(t.audio);
  screen.querySelector("#rec").onclick = doRead;
  if (DEV) screen.querySelector("#sim").onclick = async () => {
    const prev = ENGINE; ENGINE = "stub"; await doRead(); ENGINE = prev;
  };
}

function renderRecording() {
  const t = target();
  screen.innerHTML = `
    <div class="card">
      <p class="lead">Léelo en inglés</p>
      <p class="word">${t.text}</p>
      <div class="recording"><span class="pulse"></span> Escuchando… léelo ahora.</div>
    </div>`;
}

function renderRetired() {
  const t = target();
  screen.innerHTML = `
    <div class="card">
      <div class="done">
        <div class="check">✓</div>
        <div class="big">¡Lo tienes!</div>
        <p>Ya lees <b>${t.text}</b> tú solo.</p>
      </div>
      <div class="actions" style="justify-content:center;margin-top:16px">
        <button class="primary" id="next">Siguiente palabra →</button>
      </div>
    </div>`;
  screen.querySelector("#next").onclick = nextItem;
}

// pantalla de andamio (con barrera)
function renderScaffoldScreen() {
  const c = S.contract, a = c.andamio, t = target();
  const faded = a.level <= 1 ? "hint-dim" : "";
  screen.innerHTML = `
    <div class="card">
      <p class="word">${c.text}</p>
      <p class="meta">κ ${c.kappa} · se trabaja: <b>${a.dimension || "—"}</b> · <span class="lvl">andamio ${a.level}</span></p>
      <div class="task ${faded}">${a.instruction}</div>
      <div class="actions">
        ${a.audio ? `<button class="play" id="play">► Escuchar el modelo</button>` : ``}
        <button class="rec" id="rec">● Léelo tú otra vez</button>
        ${DEV ? `<button class="ghost" id="sim">▶︎ simular</button>` : ``}
      </div>
    </div>`;
  if (a.audio) screen.querySelector("#play").onclick = () => playAudio(a.audio);
  screen.querySelector("#rec").onclick = doRead;
  if (DEV) screen.querySelector("#sim").onclick = doRead;
}

function renderTeacher() {
  const byItem = {};
  for (const h of S.history) (byItem[h.item] ||= []).push(h);
  const maxLen = Math.max(1, ...Object.values(byItem).map(a => a.length));
  let rows = "";
  for (const [item, arr] of Object.entries(byItem)) {
    const last = arr[arr.length - 1];
    const bars = arr.map(h => `<div class="b" style="height:${Math.max(4, h.kappa)}%"><span>${Math.round(h.kappa)}</span></div>`).join("");
    rows += `<div><div class="row"><span>${item}</span><span>${last.dimension ? "barrera: " + last.dimension : "dominado ✓"}</span></div>
             <div class="trace">${bars || '<div class="b" style="height:4%"></div>'}</div></div>`;
  }
  screen.innerHTML = `
    <div class="card">
      <p class="lead">Vista del docente</p>
      <h1 class="h1">Mapa vivo</h1>
      <p class="meta">Trayectoria de κ por palabra. Cada niño se compara consigo mismo.</p>
      ${rows || '<p class="meta">Aún no hay lecturas. Vuelve al bucle y lee una palabra.</p>'}
      <p class="note">Sin ranking entre niños. Evidencia individual, offline. κ = instrumento de medida, no prueba de eficacia.</p>
      <div class="actions" style="margin-top:14px">
        <button class="ghost" id="back">← Volver</button>
      </div>
    </div>`;
  screen.querySelector("#back").onclick = () => { S.phase = S.contract ? (S.contract.retired ? "retired" : "scaffold") : "reading"; render(); };
}

function playAudio(src) {
  try { new Audio(src).play().catch(() => {}); } catch (e) {}
}

// -------- header / accesibilidad --------
function wireHeader() {
  document.getElementById("btnText").onclick = e => {
    document.body.classList.toggle("big"); e.currentTarget.classList.toggle("active");
  };
  document.getElementById("btnTheme").onclick = () => {
    const b = document.body;
    b.dataset.theme = b.dataset.theme === "dark" ? "light" : "dark";
  };
  document.getElementById("btnTeacher").onclick = () => {
    S.phase = S.phase === "teacher" ? (S.contract ? (S.contract.retired ? "retired" : "scaffold") : "reading") : "teacher";
    render();
  };
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
