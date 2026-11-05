# KAIRÓS Reader — paquete de entrega y guía de construcción

Handoff para terminar la app si se acaba el contexto. Cualquiera (tú, otra sesión de
Claude, o Bolt) puede continuar desde aquí.

## 0 · Qué hay en este paquete
```
CONSTRUIR.md                 ← esta guía
app/                         ← APP FUNCIONAL offline (lógica real, probada). Corre ya.
v0/v0_reference.html         ← mockup de v0: la ESTÉTICA a trasplantar (bonito pero NO offline)
prompts/
  bolt_COMPLETO.md           ← prompt Bolt que reconstruye la app entera
  bolt_CORREGIDO.md          ← prompt Bolt (versión montaje) con los arreglos de los 4 ceros
  v0_estados_y_portada.md    ← prompts de v0 para los estados que faltan + la portada viral
build/
  tailwind.config.js         ← para compilar las clases de v0 a CSS local
  tailwind-input.css         ← @tailwind + la CSS custom de v0 (eco, grano, materialidad, motion)
test_logic.mjs               ← prueba de lógica (adaptador + analizador local)
```

## 1 · Estado actual (qué está hecho y qué falta)
**HECHO (en `app/`, probado):** el bucle completo real y offline — autoinforme → leer
(micro real) → localizar barrera → andamio con audio local → desvanecer → retirar →
mapa vivo del docente. Motor de facilitación determinista (`kairos-adapter.js`),
medición local real (`engine/local-prosody.js`), PWA (sw + manifest), accesibilidad.
Diseño: funcional pero sobrio.

**FALTA:** trasplantar la **estética de v0** (`v0/v0_reference.html`) a `app/` sin romper
la lógica ni los 4 ceros, y añadir la mecánica viral «tu voz dibuja el camino».

## 2 · Cómo correr la app actual (1 minuto)
```bash
cd app
python3 -m http.server 8137
# abre http://localhost:8137/index.html   (el micro exige localhost/HTTPS)
```
Modos URL: `?dev=1` (botón «simular» sin micro) · `?engine=stub` (demo simulada).

## 3 · LAS 4 REGLAS DURAS (no romper nunca)
1. **Cero nube en runtime.** Nada de CDN, APIs, fuentes de Google ni analytics en
   ejecución. (Por eso NO se usa el Tailwind/React/Babel/Fonts por CDN del archivo v0.)
2. **Clasifica, no genera.** Sin LLM en el bucle; las tareas salen de `scaffold-bank.js`.
3. **Audio = ficheros locales** `app/audio/*.mp3` (placeholder; voces reales con
   `prebuild-audio.mjs` + ElevenLabs en build-time, nunca en runtime).
4. **Sin cuenta, sin datos, sin cámara.**

## 4 · Trasplantar la estética de v0 → app real (paso a paso)
El mockup de v0 es React+Tailwind+Babel por CDN. Lo pasamos a **vanilla + CSS local**
conservando su look. Pasos:

1. **Compila el CSS de v0 a local:**
   ```bash
   npm install -D tailwindcss@3.4.17
   npx tailwindcss -c build/tailwind.config.js -i build/tailwind-input.css -o app/styles.css --minify
   ```
   `tailwind-input.css` ya incluye la CSS custom de v0 (eco, grano, halo, sheet, motion)
   y los tokens claro/oscuro. El `content` del config escanea `app/index.html` y
   `app/app.js`, así que compila solo las clases que uses.

2. **Porta los 5 componentes JSX de `v0/v0_reference.html` a plantillas HTML** dentro de
   `app/app.js` (funciones `render*` que devuelven strings), conservando las clases
   Tailwind y las clases custom (`serif`, `echo-ring`, `sheet`, `rise`, `breathe`…).
   Mapa de componentes v0 → fases de la app:
   - `CheckInScreen`   → fase `disposicion`
   - `ReadingScreen`   → fase `reading`
   - `ScaffoldScreen`  → fase `scaffold`   (usa `contract.andamio.level/kappa/barrier`)
   - `AchievedScreen`  → fase `retired`
   - `TeacherScreen`+`KappaChart` → fase `teacher` (datos de `state.history`)
   - `Echo`, `Word`, `KappaRing`, botones → helpers reutilizables.

3. **Quita el chrome de escaparate** de v0: el marco de móvil `.phone` (372×800), la
   barra «9:41», y el `App` con pestañas Recorrido/Galería. La app real es **pantalla
   completa**; adapta los contenedores de `.phone` a full-viewport, conservando
   `grain`, `halo`, `Echo` y las `sheet`.

4. **Fuente:** NO cargues Fraunces de Google. La pila serif de sistema
   (`"Iowan Old Style", Georgia, serif`) ya está en `tailwind-input.css` y en el config.

5. **Enchufa la lógica** (ya existe en `app/app.js` actual — reúsala):
   - disposición elegida → `S.disposicion`, pasa a `reading`.
   - «Léelo tú» → `measure()` (micro real vía `local-prosody.js`, o `stub`) →
     `facilitate({measurement,target,disposicion,foco,state})` → pinta `scaffold` o
     `retired` según `contract.retired`. κ/dimensión/nivel salen del `contract`.
   - teacher map desde `S.history` (ya se acumula).
   El contrato NO se toca: `app/kairos-adapter.js` y `app/scaffold-bank.js` intactos.

6. **Estados nuevos** (pide los visuales a v0 con `prompts/v0_estados_y_portada.md`):
   - `recording` (escuchando): echo activo (clase `.echo-ring.active`, clay), contador
     ~3,5 s, sílabas iluminándose.
   - `micBlocked` (sin micro): aviso honesto «modo demostración», cae al stub.

7. **Mecánica viral «tu voz dibuja el camino»:** durante `recording`, usa la energía/
   tono que calcula `local-prosody.js` para animar las ondas de eco y trazar un sendero
   por el texto con la voz real. Es la huella de lectura hecha visible.

8. **PWA:** `app/sw.js` y `app/manifest.webmanifest` ya están. Añade al `ASSETS` del sw
   cualquier fichero nuevo (p. ej. `styles.css` ya está; añade imágenes/portada si las
   generas).

## 5 · QA antes de entregar
```bash
node test_logic.mjs                 # adaptador se retira + analizador finito [0,100]
# navegador: servir app/ y comprobar el bucle con ?dev=1
# 4 CEROS: abrir DevTools → Network, poner "Offline", recargar: la app debe funcionar
#          y NO debe haber ninguna petición de red.
```
Playwright headless (opcional): cargar `?dev=1&engine=stub`, recorrer disposición →
simular ×5 → retired → teacher; 0 errores de consola.

## 6 · Honestidad (líneas obligatorias, van en la UI/pitch)
- «huella de lectura», nunca «detección de atención».
- «instrumento de medida, no prueba de eficacia; κ demostrada solo matemáticamente».
- El `local-prosody.js` es prototipo local, NO el motor registrado (MCR/κ/xI). Para
  producción, sustitúyelo por `eco-dsp.js` real (mismo contrato) cambiando un import.
- Audio incluido = placeholder; voces reales con `prebuild-audio.mjs` (ElevenLabs
  build-time). Si una clave estuvo expuesta, **rótala**.

## 7 · Alternativa rápida con Bolt
Sube `app/` (o el zip) a Bolt y di: «continúa y pule esta app sin romper el contrato ni
los 4 ceros; aplica la estética de v0/v0_reference.html». O usa `prompts/bolt_COMPLETO.md`.
