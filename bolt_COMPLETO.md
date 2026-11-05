# Prompt para Bolt — KAIRÓS Reader COMPLETO (PWA offline, micro real, 4 ceros)

> **Atajo:** si puedes, **sube el zip `kairos-reader.zip`** y di «continúa y pule esta app
> sin romper el contrato ni los 4 ceros». Ya está hecha y probada. Si no, usa este prompt.
>
> **Sube además y USA SIN REESCRIBIR** estos ficheros del shell:
> `kairos-adapter.js`, `scaffold-bank.js`, `content/phonetic-targets.json`,
> `engine/eco-dsp-stub.js`.

---

Construye una **PWA offline instalable** llamada **KAIRÓS Reader**: app de lectura de inglés
para niños (8–12) en una **tablet modesta de 3 GB, sin internet**. Es un **instrumento de
facilitación**, no un juego: escucha cómo lee el niño con el micro, localiza dónde se traba y le
da una **tarea** para mejorar — **nunca la respuesta**. Muestra el **bucle completo**:
autoinforme → leer → localizar barrera → andamio con audio local → desvanecer → retirar → mapa
vivo del docente.

## 4 REGLAS INNEGOCIABLES
1. **Cero nube en ejecución.** Ninguna API en runtime: ni Claude, ni ElevenLabs, ni TTS, ni
   analytics. Todo en el dispositivo.
2. **Nada de IA generativa en el bucle.** El adaptador clasifica, no genera; los textos de las
   tareas salen de `scaffold-bank.js`. No añadas un LLM.
3. **Audio = ficheros locales** `audio/*.mp3` pre-generados; reprodúcelos con `new Audio(src)`.
4. **Sin cuenta, sin login, sin datos, sin cámara.** Entrada opcional por número/QR.

## Estructura de ficheros a producir
```
index.html · app.js · styles.css · manifest.webmanifest · sw.js
engine/local-prosody.js      (NUEVO — lo especifico abajo)
engine/eco-dsp-stub.js       (del shell)
kairos-adapter.js · scaffold-bank.js   (del shell, intactos)
content/phonetic-targets.json          (del shell)
audio/*.mp3 · icons/icon-192.png · icons/icon-512.png
```

## Contrato del motor (consúmelo; no lo reinventes)
Llama a `facilitate({ measurement, target, disposicion, foco, state })` de `kairos-adapter.js` y
pinta lo que devuelve:
```
{ item, text, capa:"leer", disposicion, kappa,
  barrier:{dimension,severity,detail},               // dimension ∈ ritmo|cadencia|melodia|fluidez
  andamio:{level,kind,instruction,audio,dimension},  // level 3..0; kind ∈ audio-model|rhythm-tap|chunk|melody-follow|none
  retired, givesAnswer /* SIEMPRE false */ }
```
`measurement` = `{kappa,nPVI_V,pctV,deltaF0,fluency}` (0..100). Ítems y audio en
`content/phonetic-targets.json`. Estado de intentos con `initAttemptState()` por (niño, ítem).

## engine/local-prosody.js — MEDICIÓN LOCAL REAL (lo que hace interactiva la app)
Exporta `analyze(audioBuffer) -> {kappa,nPVI_V,pctV,deltaF0,fluency}` (0..100) y `reset()`.
Calcula TODO en el navegador desde el `AudioBuffer` del micro, **sin red**:
- **Envolvente de energía (RMS)** por frames de 25 ms, salto 10 ms. Umbral de voz adaptativo
  `thr = max(0.08*maxRMS, mediana(RMS)*1.3)`. `voiced = RMS >= thr`.
- **fluidez:** entre el primer y el último frame con voz, cuenta tramos de silencio ≥180 ms
  (`pauses`) y su proporción (`pauseRatio`). `fluency = clamp(100 - pauses*10 - pauseRatio*120)`.
- **pctV (cadencia):** `voicedRatio = voicedFrames/totalFrames`; `pctV = clamp(28 + voicedRatio*34)`.
- **nPVI_V (ritmo):** detecta núcleos silábicos = picos locales de la envolvente sobre el umbral,
  distancia mínima 120 ms. Intervalos entre picos → nPVI normalizado
  `100*media(|d_k-d_{k+1}| / ((d_k+d_{k+1})/2))`; `nPVI_V = clamp(42 + nPVIraw*0.45)`.
- **deltaF0 (melodía):** tono por **autocorrelación** en ventanas de 40 ms con energía (rango
  80–400 Hz): descarta si `pico/energía < 0.3`. Convierte f0 a semitonos; rango = p90−p10;
  `deltaF0 = clamp(40 + (rango/18)*56)`.
- **kappa:** mezcla por cercanía a zonas buenas —`zone(v,lo,hi)=1` dentro, decae linealmente—:
  `kappa = clamp(100*(0.30*fluency/100 + 0.25*zone(nPVI_V,52,85) + 0.20*zone(pctV,36,50) + 0.25*zone(deltaF0,46,96)))`.
- Robusto: buffer vacío/corto/silencio → devuelve un fallback bajo `{45,46,40,52,55}`, sin crash.
- **HONESTIDAD:** es una medición local **simplificada de prototipo**, NO el motor registrado
  (MCR/κ/xI). Mismo contrato para poder cambiarla por `eco-dsp.js` real con un solo import.

## Pantallas y máquina de estados (`app.js`)
Fases: `disposicion → reading → recording → scaffold → retired → teacher`.
0. **Disposición:** el niño **declara** 🙂/😐/😴 → `disposicion` (nunca inferida).
1. **Lectura:** palabra grande (serif). Botones **“► Escuchar el modelo”** (si `andamio.audio` o
   el ítem tiene audio) y **“● Léelo tú”**.
2. **Recording:** al pulsar, graba ~3,5 s con indicador de pulso; luego mide y llama a `facilitate`.
3. **Scaffold (con barrera):** tarjeta de tarea con `andamio.instruction` (texto fijo), botón de
   audio local, y **“● Léelo tú otra vez”**. Muestra `κ`, `se trabaja: {dimension}`, `andamio
   {level}`. Al bajar el nivel, **desvanece** visualmente las pistas (`opacity` menor).
4. **Dominado (`retired`):** pantalla sobria “✓ ¡Lo tienes! Ya lees {palabra} tú solo.” + botón
   **“Siguiente palabra →”**. Sin confeti, sin puntos.
5. **Mapa vivo (docente):** botón en la barra. Trayectoria de κ por palabra (de `state.history`),
   barras simples, etiqueta de barrera/dominado. **Sin ranking** entre niños. Nota: “evidencia
   individual, offline · κ = instrumento de medida, no prueba de eficacia”.

## Captura de micro
`getUserMedia({audio:true})` → `MediaRecorder` (preferir `audio/webm`) ~3,5 s → `Blob` →
`arrayBuffer` → `AudioContext.decodeAudioData` → `AudioBuffer` → `analyze()`. Pide permiso una
vez (localhost/HTTPS). **Si el micro falla o se deniega, cae a `eco-dsp-stub.js`** y una etiqueta
lo dice honestamente.

## Conmutador de motor + modo demo
Constante `ENGINE = "local" | "stub"` (por defecto `local`). Parámetros de URL:
`?engine=stub` (demo sin micro) y `?dev=1` (muestra un botón “▶︎ simular” que avanza el bucle con
el stub, para probar sin hablar). Etiqueta en el pie: `local` → “medición local (prototipo)”,
sin micro → “demostración simulada (sin micro)”, stub → “demostración simulada”.

## PWA offline
- `sw.js`: precache de index/css/js/json/módulos/iconos/`audio/*.mp3`; estrategia **cache-first**
  (offline total; red solo en primera carga). `skipWaiting` + `clients.claim`.
- `manifest.webmanifest`: name “KAIRÓS Reader”, `display:standalone`, `theme_color #1f7a6b`,
  `background_color #faf7f2`, iconos 192/512 (512 `purpose:"any maskable"`).

## Accesibilidad (DUA)
Barra con **texto grande** y **claro/oscuro**. Los apoyos de **acceso** (escuchar, leer) están
**siempre disponibles**; solo se desvanecen las **pistas al procesamiento** (niveles de andamio).

## Audio local (build-time, no runtime)
Incluye `prebuild-audio.mjs`: genera `audio/*.mp3` **una vez** con ElevenLabs en la máquina del
dev (`ELEVENLABS_API_KEY` solo en entorno, nunca en el código; `.gitignore` bloquea audio y
`.env`). Mientras tanto, incluye placeholders para que corra. En runtime, **cero nube**.

## Diseño visual (cálido, Oaxaca/Apple)
- Crema `#faf7f2`, tinta `#241f1a`, barro `#c0562a`, jade `#1f7a6b`. Modo claro y oscuro con
  variables CSS. Serif cálida (Georgia/“Iowan Old Style”) para la palabra a leer; sans del
  sistema para el cuerpo. Tarjetas redondeadas, mucho aire, transiciones tranquilas. **No estilo
  Duolingo**, nada de rachas/puntos/ligas.

## Microcopia honesta (literal)
“huella de lectura”, nunca “detección de atención”. En ayuda/créditos: *“Instrumento de medida,
no prueba de eficacia. κ demostrada solo matemáticamente; validez causal → estudio preregistrado.
El audio incluido es placeholder; la medición local es un prototipo, no el motor registrado.”*

## Criterios de aceptación (verifícalos antes de entregar)
1. Corre **offline** (modo avión) tras instalar la PWA. 2. El micro mide de verdad y el bucle
reacciona (κ cambia con la lectura). 3. El andamio **se desvanece** al mejorar y **se retira** al
dominar; **reaparece** si recae. 4. `givesAnswer` siempre `false`; ningún texto libre generado.
5. Cero llamadas de red en runtime (compruébalo en la pestaña Network en modo avión). 6. Mapa
vivo sin ranking. 7. Texto grande y claro/oscuro funcionan. 8. Con `?dev=1` el bucle se recorre
sin micro.

**Objetivo:** que al abrirla en una tablet de 3 GB, sin red, se vea el bucle entero —leer, que te
escuche de verdad, que te ayude sin darte la respuesta, y que se retire— calmado y bonito.
