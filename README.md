# KAIRÓS Reader — app completa (PWA offline)

Piel de lectura de inglés para niños (8–12) sobre el motor de facilitación EMMA.
**Offline, sin cuentas, sin cámara, sin nube en ejecución.** Muestra el bucle entero:
autoinforme → leer (micro real) → localizar barrera → andamio con audio local →
desvanecer → retirar → mapa vivo del docente.

## Cómo arrancar (1 minuto)

El micrófono exige `localhost` o HTTPS. Sirve la carpeta con cualquier servidor estático:

```bash
cd kairos-reader
python3 -m http.server 8137
# abre http://localhost:8137/index.html
```

(o `npx serve`, o el `server.js` de UBUN.ECO). La primera carga necesita servidor;
luego, al instalarla como PWA, funciona **100 % en modo avión**.

## Qué es cada cosa

| Fichero | Qué es |
|---|---|
| `index.html` · `app.js` · `styles.css` | La **piel**: pantallas y bucle. Pinta el contrato, no decide. |
| `kairos-adapter.js` · `scaffold-bank.js` | El **motor de facilitación** (tu shell, sin tocar). Determinista, clasifica, no genera. |
| `engine/local-prosody.js` | **Medición local real** (prototipo): mide la voz del micro en el navegador. |
| `engine/eco-dsp-stub.js` | Medición **simulada** (demo sin micro). |
| `content/phonetic-targets.json` | 6 ítems de inglés con su franja y su audio local. |
| `audio/*.mp3` | Audio del modelo. **Hoy son PLACEHOLDER** (tonos suaves). |
| `prebuild-audio.mjs` | Genera las voces reales **una vez, en tu máquina** (ElevenLabs build-time). |
| `sw.js` · `manifest.webmanifest` · `icons/` | PWA instalable y offline. |

## El motor de medición (importante y honesto)

- Por defecto corre **`local-prosody.js`**: captura el micro y calcula ritmo (nPVI-V),
  cadencia (%V), melodía (Δf0 por autocorrelación), fluidez (pausas) y κ, **en local**.
- Es una **medición simplificada de prototipo**, **no** tu motor registrado (método MCR / κ /
  marco xI). Las escalas a las franjas son heurísticas, no calibración validada.
- **Para el producto:** sustituye `engine/local-prosody.js` por tu `eco-dsp.js` real —mismo
  contrato `analyze(audioBuffer) → {kappa,nPVI_V,pctV,deltaF0,fluency}`— y cambia el import en
  `app.js`. Nada más.
- Modos por URL: `?engine=stub` (demo sin micro) · `?dev=1` (botón «simular» para probar el
  bucle sin hablar). Si el micro se deniega, cae al stub y la etiqueta lo dice.

## Audio: de placeholder a voces reales

Los `audio/*.mp3` incluidos son **marcadores** para que la app corra ya. Para voces reales,
en tu máquina y **antes del hackathon**:

```bash
export ELEVENLABS_API_KEY=xxxxx      # nunca en el código ni en el repo
node prebuild-audio.mjs              # regenera audio/*.mp3 locales
```

En ejecución la app **no llama a ElevenLabs ni a ninguna nube**: reproduce estos ficheros.
Para cero-nube también en build, usa un TTS local (p. ej. Piper).

## Los 4 ceros (candado)

Sin nube · sin cuentas · sin datos externos · sin modelo remoto. No hay ninguna llamada de red
en runtime. Si alguna clave estuvo expuesta en un chat o repo, **rótala**.

## Accesibilidad (DUA)

Texto grande y modo claro/oscuro (barra superior). Los apoyos de **acceso** (escuchar, leer)
están siempre disponibles; solo se desvanecen las **pistas al procesamiento** (niveles de andamio).

## Honestidad para presentar

*Instrumento de medida, no prueba de eficacia · «huella de lectura», nunca «detección de
atención» · κ demostrada solo matemáticamente; la validez causal requiere un estudio
preregistrado. El audio incluido es placeholder; la medición local es un prototipo, no el
motor registrado.*

Licencia de la cáscara: AGPL-3.0. El método MCR / κ / el marco xI son obra previa registrada.
