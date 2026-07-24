// Test ISE — Índice de Sistemas de Ejecución
// 3 ejes × 10 preguntas, Likert 1–5. Ítems reverse puntúan 6−r.
// Fuente: insumos/01-test-ise.md

export const AXES = [
  { id: 'claridad', name: 'Claridad', question: '¿Sabes qué importa y hacia dónde vas?' },
  { id: 'energia',  name: 'Energía',  question: '¿Tu cuerpo y tu mente sostienen lo que quieres lograr?' },
  { id: 'foco',     name: 'Foco',     question: '¿Ejecutas sin autosabotaje?' },
];

// r: true = ítem inverso
export const QUESTIONS = [
  // Claridad
  { ax: 'claridad', t: 'Sé exactamente cuáles son mis 3 prioridades de esta semana.' },
  { ax: 'claridad', t: 'Puedo explicar en una frase hacia dónde va mi vida en los próximos 3 años.' },
  { ax: 'claridad', t: 'Cuando digo que sí a algo nuevo, sé conscientemente a qué le estoy diciendo que no.' },
  { ax: 'claridad', t: 'Tomo decisiones importantes sin darles vueltas durante días.' },
  { ax: 'claridad', t: 'Mi agenda refleja mis prioridades reales, no las urgencias de otros.' },
  { ax: 'claridad', t: 'Termino el día sabiendo si avancé en lo importante.' },
  { ax: 'claridad', t: 'Siento que mi vida la dirigen las circunstancias y no yo.', r: true },
  { ax: 'claridad', t: 'Tengo claro qué actividades debería soltar, delegar o eliminar.' },
  { ax: 'claridad', t: 'Mis metas están escritas y las reviso al menos una vez por semana.' },
  { ax: 'claridad', t: 'Me cuesta distinguir entre lo urgente y lo importante.', r: true },
  // Energía
  { ax: 'energia', t: 'Me despierto con energía suficiente para lo que quiero lograr.' },
  { ax: 'energia', t: 'Duermo al menos 7 horas la mayoría de las noches.' },
  { ax: 'energia', t: 'Hago ejercicio o muevo mi cuerpo al menos 3 veces por semana.' },
  { ax: 'energia', t: 'Llego a la tarde completamente drenado.', r: true },
  { ax: 'energia', t: 'Tengo pausas reales de recuperación durante el día.' },
  { ax: 'energia', t: 'Uso comida, pantallas o alcohol para “desconectarme” del estrés.', r: true },
  { ax: 'energia', t: 'Protejo mis espacios de descanso sin sentir culpa.' },
  { ax: 'energia', t: 'Mi energía es estable a lo largo de la semana, no una montaña rusa.' },
  { ax: 'energia', t: 'Trabajo enfermo o agotado por no “quedar mal” con otros.', r: true },
  { ax: 'energia', t: 'Termino la semana con reservas de energía, no en cero.' },
  // Foco
  { ax: 'foco', t: 'Puedo trabajar 60–90 minutos en algo importante sin interrumpirme.' },
  { ax: 'foco', t: 'Reviso el celular impulsivamente mientras hago tareas importantes.', r: true },
  { ax: 'foco', t: 'Empiezo el día por lo más importante, no por correos o mensajes.' },
  { ax: 'foco', t: 'Postergo tareas clave haciendo cosas “productivas” pero menores.', r: true },
  { ax: 'foco', t: 'Cumplo los compromisos que hago conmigo mismo.' },
  { ax: 'foco', t: 'El perfeccionismo me hace tardar más de lo necesario o no entregar.', r: true },
  { ax: 'foco', t: 'Cuando me distraigo, me doy cuenta rápido y regreso a la tarea.' },
  { ax: 'foco', t: 'Mi diálogo interno me castiga más de lo que me impulsa.', r: true },
  { ax: 'foco', t: 'Tengo rituales o sistemas que me ayudan a entrar en concentración.' },
  { ax: 'foco', t: 'Celebro los avances en lugar de ver solo lo que falta.' },
];

export const ARCHETYPES = [
  {
    min: 30, max: 69, name: 'El Apagado', sub: 'Modo supervivencia',
    desc: 'Vives en reacción. La agenda, el cansancio y las urgencias de otros deciden por ti. La prioridad no es hacer más: es parar la fuga.',
  },
  {
    min: 70, max: 94, name: 'El Bombero', sub: 'Esfuerzo sin sistema',
    desc: 'Trabajas duro y logras cosas, pero a punta de voluntad. Apagas incendios todo el día y la motivación se agota antes que la semana.',
  },
  {
    min: 95, max: 124, name: 'El Constructor', sub: 'Estrategia con saboteo mental',
    desc: 'La base ya está: sabes priorizar, recuperarte y ejecutar. Pero cargas ruido mental, distracciones y autoexigencia que frenan tu velocidad. Tu siguiente nivel no es hacer más, es soltar.',
  },
  {
    min: 125, max: 150, name: 'El Arquitecto', sub: 'Sistemas que trabajan por ti',
    desc: 'Modo élite. Tus sistemas sostienen tu vida sin fricción. El reto ahora es proteger lo construido y elevar el techo de tus metas.',
  },
];

export const URGENCY = {
  claridad: 'Definir dirección: sin un norte escrito, cualquier sistema optimiza lo equivocado.',
  energia: 'Blindar tu energía: recuperación, sueño y pausas antes que más productividad.',
  foco: 'Cortar el autosabotaje: menos frentes abiertos, más bloques profundos y menos autoexigencia.',
};

// answers: array de 30 valores 1–5 en el orden de QUESTIONS
export function scoreTest(answers) {
  const byAxis = { claridad: 0, energia: 0, foco: 0 };
  QUESTIONS.forEach((q, i) => {
    const raw = answers[i];
    byAxis[q.ax] += q.r ? 6 - raw : raw;
  });
  const total = byAxis.claridad + byAxis.energia + byAxis.foco;
  const archetype = ARCHETYPES.find((a) => total >= a.min && total <= a.max) || ARCHETYPES[0];
  const weakest = AXES.reduce((w, a) => (byAxis[a.id] < byAxis[w.id] ? a : w), AXES[0]);
  return { byAxis, total, archetype, weakest: weakest.id, urgency: URGENCY[weakest.id] };
}

// Convierte texto libre ("el Controlador", "víctima") al id canónico; null si no matchea.
export function matchSaboteur(text) {
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const t = norm(text || '');
  const hit = SABOTEURS.find((s) => t.includes(norm(s.id)) || t.includes(norm(s.name)));
  return hit ? hit.id : null;
}

export const SABOTEURS = [
  { id: 'perfeccionista', name: 'Perfeccionista', hint: '“No es suficiente.” Retrasa o no entrega por pulir.' },
  { id: 'complaciente',   name: 'Complaciente',   hint: '“No puedo quedar mal.” Dice sí por compromiso.' },
  { id: 'hiperracional',  name: 'Hiperracional',  hint: 'Analiza sin fin para no sentir ni decidir.' },
  { id: 'hiperlogro',     name: 'Hiperlogro',     hint: 'Vale por lo que produce. No sabe parar.' },
  { id: 'victima',        name: 'Víctima',        hint: '“Siempre me pasa a mí.” Se repliega y rumia.' },
  { id: 'controlador',    name: 'Controlador',    hint: 'Todo tiene que pasar por él. No delega.' },
];
