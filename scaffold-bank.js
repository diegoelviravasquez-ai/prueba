// scaffold-bank.js — banco FIJO de andamios de facilitacion (clasifica, no genera)
// -----------------------------------------------------------------------------
// Principio constitucional: el motor NO genera texto libre para el nino. Elige un
// movimiento de un banco cerrado. Cada barrera (dimension de la prosodia donde se
// cae) tiene una escalera de andamios con NIVELES 3 -> 1 que se desvanecen al
// dominar (fade). Nivel 0 = sin andamio (el nino ya puede solo).
//
// 'kind' que la piel KAIROS sabe pintar:
//   audio-model   -> reproduce el audio local de referencia (pre-generado, offline)
//   rhythm-tap    -> el nino marca las silabas con toques mientras escucha
//   chunk         -> parte la frase en trozos (una silaba/palabra cada vez)
//   melody-follow -> flecha de entonacion que sube/baja con el modelo
//   none          -> el andamio se ha retirado
//
// Nada de este fichero sale a la red. Todo el texto es fijo y revisable.

export const SCAFFOLD_BANK = {
  // nPVI-V: variabilidad del ritmo entre silabas
  ritmo: [
    { level: 3, kind: "rhythm-tap",  usesAudio: true,  instruction: "Escucha y marca cada sílaba con un toque, igual que el modelo." },
    { level: 2, kind: "rhythm-tap",  usesAudio: false, instruction: "Vuelve a leerlo marcando tú el ritmo con la mano." },
    { level: 1, kind: "chunk",       usesAudio: false, instruction: "Léelo una vez más, sin prisa, sílaba a sílaba." }
  ],
  // %V: proporcion vocalica (cadencia vocal/consonante)
  cadencia: [
    { level: 3, kind: "audio-model", usesAudio: true,  instruction: "Escucha cómo alarga las vocales el modelo y repítelo." },
    { level: 2, kind: "chunk",       usesAudio: false, instruction: "Separa la palabra en trozos y alarga las vocales." },
    { level: 1, kind: "chunk",       usesAudio: false, instruction: "Dilo otra vez, cuidando las vocales largas." }
  ],
  // Delta-f0: rango melodico (entonacion)
  melodia: [
    { level: 3, kind: "melody-follow", usesAudio: true,  instruction: "Sigue la flecha de la melodía mientras el modelo lee." },
    { level: 2, kind: "melody-follow", usesAudio: false, instruction: "Vuelve a leerlo subiendo y bajando la voz como la flecha." },
    { level: 1, kind: "audio-model",   usesAudio: true,  instruction: "Una escucha más y lo dices tú con esa música." }
  ],
  // fluidez / pausas: ruptura del flujo
  fluidez: [
    { level: 3, kind: "chunk",       usesAudio: true,  instruction: "Escucha el modelo y léelo en trozos, parando donde él para." },
    { level: 2, kind: "chunk",       usesAudio: false, instruction: "Léelo de nuevo juntando las palabras en grupos." },
    { level: 1, kind: "audio-model", usesAudio: true,  instruction: "Una escucha de apoyo y lo lees seguido tú." }
  ]
};

// Andamio vacio: el nino ya no necesita apoyo (se ha retirado).
export const SCAFFOLD_NONE = { level: 0, kind: "none", usesAudio: false, instruction: "" };

// Devuelve el movimiento de la escalera para una barrera y un nivel dado.
// Hace "clamp" al nivel mas alto disponible; nivel <= 0 => andamio retirado.
export function scaffoldFor(dimension, level) {
  if (level <= 0) return { ...SCAFFOLD_NONE };
  const ladder = SCAFFOLD_BANK[dimension];
  if (!ladder) return { ...SCAFFOLD_NONE };
  const hit = ladder.find((s) => s.level === level);
  return hit ? { ...hit } : { ...ladder[0] };
}
