# Prompt corregido para Bolt / v0 / Lovable — KAIRÓS Reader (PWA offline, 4 ceros)

> **Pega esto como prompt.** Además, **sube los ficheros del shell de referencia tal cual**
> y ÚSALOS sin reescribir su lógica:
> `kairos-adapter.js`, `scaffold-bank.js`, `content/phonetic-targets.json`,
> `engine/eco-dsp-stub.js`.
> Y antes del hackathon, en TU máquina: `node prebuild-audio.mjs` para generar los
> `/audio/*.mp3` locales (ElevenLabs en build-time, NO en la app).

---

Construye una **PWA offline instalable** llamada **KAIRÓS Reader**: una app de lectura de
inglés para niños (8–12 años) que corre en una **tablet modesta de 3 GB, sin internet**. Es un
**instrumento de facilitación**, no un juego: escucha cómo lee el niño, localiza dónde se traba
y le da una **tarea** para mejorar — **nunca le da la respuesta**.

## LAS 4 REGLAS INNEGOCIABLES (si rompes una, la app está mal)

1. **Cero nube en ejecución.** La app NO llama a ninguna API en runtime: **ni Claude, ni
   ElevenLabs, ni ningún servicio de voz, ni analytics**. Todo ocurre en el dispositivo.
2. **Nada de IA generativa en el bucle.** El adaptador **clasifica, no genera**. Los textos de
   las tareas salen del banco fijo `scaffold-bank.js`. **No añadas llamadas a un LLM** para
   «dar feedback» ni para producir texto: está prohibido por diseño (y por el EU AI Act 5.1.f).
3. **El audio son ficheros locales** `/audio/*.mp3` pre-generados. Reprodúcelos con
   `new Audio(andamio.audio)`. **Nunca** una API de TTS en runtime.
4. **Sin cuenta, sin login, sin recogida de datos, sin cámara, sin caras.** Dispositivo
   compartido por la clase (entrada opcional por número/QR). Solo voz y toques.

> Si una versión anterior tuvo claves de ElevenLabs o de Claude en el código o en un chat,
> **rótalas** antes de seguir. La clave de ElevenLabs vive solo en el `.env` del nodo para el
> `prebuild`, nunca en la app ni en el repo.

## Consume la lógica del shell — NO la reinventes

Llama a `facilitate({ measurement, target, disposicion, foco, state })` de `kairos-adapter.js`
y **pinta lo que devuelve**. Contrato:

```
{
  item, text, capa:"leer",
  disposicion,                 // estado DECLARADO por el niño (nunca inferido)
  kappa,                       // 0..100
  barrier: { dimension, severity, detail },   // dimension ∈ ritmo|cadencia|melodia|fluidez
  andamio: { level, kind, instruction, audio, dimension }, // level 3..0; kind ∈ audio-model|rhythm-tap|chunk|melody-follow|none
  retired,                     // true => el niño ya puede solo
  givesAnswer                  // SIEMPRE false
}
```

Los ítems y su audio local están en `content/phonetic-targets.json` (6 ítems de demo).
El banco de andamios está en `scaffold-bank.js`. No dupliques esa lógica en la UI.

## LA MEDICIÓN — esto es lo que faltaba para que «interactúe»

`engine/eco-dsp-stub.js` **ignora el micro** y devuelve una trayectoria simulada que mejora en
cada lectura. Sirve para ver el bucle, pero no reacciona a la voz real. Implementa el micro así,
**100 % en el navegador, sin nube**:

1. **Captura real** con `getUserMedia({audio:true})` + Web Audio API al pulsar **“Léelo tú”**
   (graba ~2–4 s → `AudioBuffer`). Pide permiso de micro una vez; funciona en `localhost`/HTTPS.
2. **Analizador local ligero** `engine/local-prosody.js` que recibe el `AudioBuffer` y devuelve
   **el mismo contrato** que el stub — `{ kappa, nPVI_V, pctV, deltaF0, fluency }` (0..100) —
   calculado en local:
   - **fluency / pausas:** segmenta por energía (RMS por frames de ~25 ms); cuenta silencios y
     su duración vs. la duración total.
   - **nPVI_V (ritmo):** variabilidad de la duración entre núcleos vocálicos (picos de energía).
   - **pctV (cadencia):** proporción de tiempo “sonoro/vocálico” sobre el total.
   - **deltaF0 (melodía):** rango de tono por **autocorrelación** (pitch) a lo largo del clip.
   - **kappa:** combinación normalizada de las cuatro contra la franja base.
   Mantén el contrato idéntico para poder intercambiar stub ↔ local ↔ motor real sin tocar la UI.
3. **Conmutador honesto:** una constante `ENGINE = "local" | "stub"`. Por defecto `"local"`.
   En la UI, una etiqueta discreta dice qué motor corre (ver microcopia).

> **Honestidad:** `local-prosody.js` es una **medición local simplificada**, no el motor real.
> El motor de κ (método MCR, marco xI) es **obra previa registrada** y no se incluye. Nunca
> presentes el analizador ligero como “el motor”.

## El bucle (pantallas)

0. **Autoinforme (al entrar):** el niño **declara** cómo está hoy — 🙂 / 😐 / 😴 — y eso es
   `disposicion`. **Nunca se infiere.** Botón grande, una sola pulsación.
1. **Lectura:** la palabra/frase, grande, serif cálida. Botón **“● Léelo tú”** (graba → analiza →
   `facilitate()`).
2. **Con barrera:** tarjeta de **tarea** con `andamio.instruction` (texto fijo). Si
   `andamio.audio`, botón **“► Escuchar el modelo”** que reproduce el **mp3 local**. Botón
   **“● Léelo tú”** para reintentar. Muestra discreto: `κ`, `se trabaja: {dimension}`, nivel de
   andamio.
3. **Desvanecer:** cuando baja el nivel de andamio, la ayuda se reduce **visualmente** (menos
   pistas). Es lo esperado: más autonomía.
4. **Dominado (`retired:true`):** pantalla sobria: **“✓ ¡Lo tienes! Ya lo lees tú solo.”**
   Sin confeti, sin puntos.
5. **Vista docente “mapa vivo”:** trayectoria de **κ por niño** (de `state.history`) y la
   dimensión de la barrera. **Sin ranking** entre niños — cada uno se compara consigo mismo.
   Es la evidencia individual, offline, que hace la app transferible (el dato que una institución
   no tiene con “tabletas desplegadas”).

## PWA offline de verdad

- **Service worker** que cachea el shell de la app, los `/audio/*.mp3`, el JSON de ítems y los
  módulos JS → instalable y 100 % funcional **en modo avión**.
- **manifest.webmanifest** (nombre, icono, `display: standalone`, orientación).
- Primera carga puede ser por `localhost`/HTTPS (el micro lo exige); luego, offline total.

## Accesibilidad (DUA) — distinción clave

- Opción de **texto grande** y **modo claro/oscuro**.
- Los apoyos de **acceso** (escuchar el modelo, texto fácil) están **siempre disponibles** y
  **no se retiran**. Solo se desvanecen las **pistas al procesamiento** (los niveles de andamio).

## Diseño visual (cálido, Oaxaca/Apple)

- Fondo crema `#faf7f2`, tinta `#241f1a`. Acento barro `#c0562a`, verde jade `#1f7a6b`.
- Serif cálida para titulares y la palabra a leer (Georgia / “Iowan Old Style”); sans del sistema
  para el cuerpo. Tarjetas redondeadas, mucho aire, transiciones tranquilas. **No estilo Duolingo.**

## Microcopia honesta (literal)

- Se dice **“huella de lectura”**, nunca “detección de atención”.
- Etiqueta del motor: `local` → *“medición local (prototipo)”*; `stub` → *“demostración
  simulada”*. Nunca *“motor de κ”*.
- En créditos/ayuda: *“Instrumento de medida, no prueba de eficacia. κ demostrada solo
  matemáticamente; la validez causal requiere un estudio preregistrado.”*

## Tecnología

- **Vanilla JS o React ligero**, sin dependencias pesadas (corre en tablet de 3 GB).
- **Importa y usa** `kairos-adapter.js` y `scaffold-bank.js` tal cual; no reescribas el andamio.
- Entrega listo para servir desde un servidor estático local; el micro necesita `localhost`/HTTPS.

## Por qué así (mapa a la rúbrica — no lo pintes, constrúyelo)

- **Acabado (30%):** el bucle corre de punta a punta **offline y con micro real** (local-prosody).
  Enséñalo en modo avión.
- **Transferibilidad (30%):** el **mapa vivo** emite evidencia individual de aprendizaje — el dato
  que a una institución le falta — y la app es una **capa/PWA** sobre la tablet que ya existe,
  no un sistema nuevo que adoptar.
- **Países desfavorecidos (20%):** 3 GB, offline, sin cuentas; el audio y la medición viven en
  el dispositivo.
- **Innovación (20%):** el material se adecúa al niño (andamio por dimensión prosódica) y el
  apoyo **se retira** — se mide por cuánto menos se necesita.

**Objetivo:** ver el **bucle completo** — autoinforme → leer (micro real) → localizar barrera →
andamio con audio local → desvanecer → retirar → mapa vivo — bonito, calmado, 100 % offline.
