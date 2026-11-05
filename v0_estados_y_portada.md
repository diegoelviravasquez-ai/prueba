# Prompts de v0 pendientes (mismo sistema de diseño que las 5 pantallas ya generadas)

Pégalos en el MISMO chat de v0 donde hiciste las 5 pantallas, para que herede el sistema
(eco, grano, materialidad, Fraunces/serif, paleta papel/tinta/barro/jade/ocre, κ, claro/oscuro).
Cuando te los dé, guarda el código: se integran como los demás.

## 1 · Estado "Escuchando" (tras pulsar «Léelo tú») — NECESARIO para el bucle
```
Añade a la app KAIRÓS Reader que acabas de diseñar (mismo sistema) una pantalla nueva:
el ESTADO DE ESCUCHA, el momento en que el micro graba al niño leyendo.
- La palabra sigue grande arriba (wa·ter).
- Las ondas de eco ahora laten ACTIVAS: más rápidas y teñidas de barro (clay), como si
  el aparato "escuchara" de verdad.
- Bajo la palabra, las sílabas se iluminan en secuencia al ritmo (wa… ter…).
- Un anillo de grabación sutil con un contador suave (~3,5 s).
- Texto sereno: "Escuchando… léelo ahora." Nada estridente, sin rojo agresivo.
Entrega el componente React autónomo, mismo tema claro/oscuro, sin lógica real.
```

## 2 · Estado "Sin micrófono / modo demostración" (honestidad) — NECESARIO
```
Añade a KAIRÓS Reader (mismo sistema) un estado honesto para cuando el micrófono no
está disponible o se deniega el permiso: aviso cálido, no alarmante, con la misma
materialidad de papel:
- "Sin micrófono — modo demostración."
- Subtexto: "El bucle se muestra con una lectura simulada."
- Un botón para continuar igualmente.
- Que se sienta como una elección honesta, no un error. Icono de línea tipo grabado,
  tono jade/ocre, nada de alertas rojas.
Entrega el componente React autónomo.
```

## 3 · Entrada de clase sin cuenta (opcional)
```
Añade a KAIRÓS Reader una pantalla de entrada para dispositivo compartido en aula, SIN
login ni datos: elegir "tu número" (1–30) en una cuadrícula táctil cálida, o un QR.
Microcopia: "Sin cuentas. Esta tablet es de toda la clase." Mismo sistema visual.
```

## 4 · PORTADA VIRAL "Ve por el eco" (el screenshot que se comparte)
```
Diseña una pantalla HERO / landing para KAIRÓS Reader (mismo sistema; modo oscuro
premium atmosférico). De las que la gente captura y comparte: una sola imagen que lo
diga todo.
Centro absoluto: el MOTIVO DEL ECO a gran escala — ondas concéntricas que, al
expandirse, DIBUJAN la silueta de una palabra o de un niño leyendo (ecolocalización de
un murciélago revelando un espacio en la oscuridad). Lento, vivo, hipnótico.
Tipografía protagonista, enorme, Fraunces:
   "Ve por el eco."
y debajo, más pequeño:
   "La inteligencia artificial que se mide por cuánto menos la necesitas."
Composición editorial asimétrica, mucho aire, profundidad real, halo cálido. En oscuro
el eco brilla en jade sobre carbón. Movimiento sereno en bucle. Abajo, discreto:
"offline · sin nube · sin cuentas".
PROHIBIDO: stock, mascotas, gamificación, texto de más, estética corporativa. Es una
portada de revista de ciencia. React + Tailwind autónomo, claro/oscuro, sin lógica.
```

## La mecánica viral REAL (la construye Claude, no v0: necesita micro real)
«Tu voz dibuja el camino»: el niño lee en voz alta y ve su propia huella convertirse en
las ondas de eco y en un sendero por el texto. Hablar y ver tu voz volverse algo bello
es lo que se comparte solo — y es cierto (huella de lectura + re-prosodización). Se
injerta sobre `engine/local-prosody.js` (ya mide tono/ritmo/pausas en local).
