// Programa de 6 semanas — Ser (S1–S2) → Hacer (S3–S4) → Tener (S5–S6)
// Fuente: insumos/02-programa-6-semanas.md

export const PROGRAM = [
  {
    week: 1, phase: 'Ser · Medir', title: 'Arquetipo situacional',
    goal: 'Una foto honesta y con datos de cómo vives hoy.',
    exercises: [
      { id: 's1e1', t: 'Hacer el test ISE inicial', note: 'Si ya lo hiciste, registra el resultado en la pestaña Test.' },
      { id: 's1e2', t: 'Auditoría de tiempo: registrar 5 días en bloques de 30–60 min', note: 'Qué hiciste, para quién, y si fue elección o reacción. Usa la nota del check-in de noche.' },
      { id: 's1e3', t: 'Registro de energía: 2 check-ins diarios toda la semana', note: 'Mañana y noche, en la pestaña Hoy.' },
      { id: 's1e4', t: 'Mapa de fugas: identificar las 5 actividades que más drenan y las 3 que más recargan', note: 'Escríbelo como entregable al cerrar la semana.' },
    ],
    deliverable: 'Mi foto actual: distribución real del tiempo, curva de energía, top fugas.',
    coachMode: 'Preguntas de observación, sin soluciones: "¿Esa reunión la elegiste o te eligió?"',
  },
  {
    week: 2, phase: 'Ser · Medir', title: 'Arquetipo mental',
    goal: 'Hacer visible el diálogo interno y los patrones de autosabotaje.',
    exercises: [
      { id: 's2e1', t: 'Registrar cada pensamiento de autoexigencia o "no es suficiente"', note: 'Usa Más → Saboteadores: frase literal + situación.' },
      { id: 's2e2', t: 'Clasificar los registros por saboteador', note: 'Perfeccionista, complaciente, hiperracional, hiperlogro, víctima, controlador.' },
      { id: 's2e3', t: 'Escribir el reencuadre de tus 3 frases más frecuentes', note: 'La versión que diría un mentor exigente pero justo.' },
      { id: 's2e4', t: 'Estimar el costo semanal (horas/energía) de tu patrón principal', note: 'Conecta con los datos de la semana 1.' },
    ],
    deliverable: 'Mi arquetipo mental: top 2 saboteadores, frases típicas y reencuadres.',
    coachMode: 'Refleja el lenguaje saboteador con self-talk distanciado usando tu nombre.',
  },
  {
    week: 3, phase: 'Hacer · Ordenar', title: 'Inventario y poda',
    goal: 'Listar todo lo que cargas y soltar lo que no corresponde.',
    exercises: [
      { id: 's3e1', t: 'Inventario total: volcar TODOS los compromisos, proyectos, roles y pendientes', note: 'Trabajo, familia, personal, deudas mentales. Usa el entregable como lista.' },
      { id: 's3e2', t: 'Clasificar cada ítem: Dirigir / Delegar / Diferir / Descartar', note: 'Dirigir = solo yo. Diferir necesita fecha concreta.' },
      { id: 's3e3', t: 'Ejecutar la poda: mínimo 5 ítems descartados o delegados ESTA semana', note: 'Conversación, correo o renuncia explícita — hecha, no planeada.' },
      { id: 's3e4', t: 'Escribir tu regla de entrada para nuevos compromisos', note: '"Solo digo sí si…"' },
    ],
    deliverable: 'Inventario clasificado + 5 podas ejecutadas + regla de entrada.',
    coachMode: 'Aboga por el descarte: "¿Qué pasaría realmente si esto no se hace?"',
  },
  {
    week: 4, phase: 'Hacer · Visibilizar', title: 'Alter ego y hábitos',
    goal: 'Diseñar la versión objetivo y los hábitos que la sostienen.',
    exercises: [
      { id: 's4e1', t: 'Crear tu alter ego', note: 'Más → Alter ego: nombre propio, 3 rasgos, cómo decide, frase de invocación y tótem (sugerido: girar el anillo).' },
      { id: 's4e2', t: 'Definir 3 prioridades de trimestre con "qué significa ganar"', note: 'Máximo 3. Escritas en el entregable.' },
      { id: 's4e3', t: 'Configurar 2–3 hábitos ancla (uno por eje débil)', note: 'Más → Hábitos. Formato: disparador → acción mínima. Con Energía crítica: cierre de jornada, hora de sueño protegida, 3 pausas al día.' },
      { id: 's4e4', t: 'Diseñar tu agenda ideal de la semana', note: 'Bloques de foco, recuperación y vida personal ANTES de reuniones de otros.' },
    ],
    deliverable: 'Alter ego configurado + 3 prioridades + hábitos con recordatorios.',
    coachMode: 'Frena el sobre-diseño: "3 hábitos, no 10 — tu perfeccionista quiere 10."',
  },
  {
    week: 5, phase: 'Tener · Ejecutar', title: 'Sistemas e integración',
    goal: 'Que la semana funcione por sistema, no por memoria ni voluntad.',
    exercises: [
      { id: 's5e1', t: 'Ritual de planeación semanal (30 min): 3 resultados + bloques agendados primero', note: 'El coach te lo guía cada lunes (flujo WOOP).' },
      { id: 's5e2', t: 'Ritual de cierre diario toda la semana', note: 'Es el check-in de noche: ¿avancé? ¿qué suelto? ¿LA tarea de mañana?' },
      { id: 's5e3', t: 'Completar mínimo 5 bloques de foco de 90 min', note: 'Más → Foco: celular fuera, una sola cosa, timer corriendo.' },
      { id: 's5e4', t: 'Revisar el tablero de métricas al cierre de semana', note: 'Bloques, energía, hábitos, avance en prioridades.' },
    ],
    deliverable: 'Una semana completa operada con rituales + tablero con datos reales.',
    coachMode: 'Modo operador: revisa el plan del lunes, pregunta por el cierre, renegocia sin drama.',
  },
  {
    week: 6, phase: 'Tener · Reforzar', title: 'Nueva identidad',
    goal: 'Consolidar la identidad y asegurar que el sistema sobreviva sin el programa.',
    exercises: [
      { id: 's6e1', t: 'Re-test ISE y comparación contra la línea base', note: 'Pestaña Test → el comparativo aparece automático.' },
      { id: 's6e2', t: 'Carta de identidad: 5 afirmaciones "Soy alguien que…" con evidencia', note: 'Incluye la convergencia: qué rasgos de tu alter ego ya son tuyos (revisa el registro de invocaciones).' },
      { id: 's6e3', t: 'Llevarlo al mundo: comunicar 2 cambios a tu equipo/familia', note: 'Qué ya no haces, qué protegerás.' },
      { id: 's6e4', t: 'Plan de sostenimiento 90 días', note: 'Qué rituales siguen, re-test mensual, y protocolo de recaída: "si fallo 3 días seguidos, hago X".' },
    ],
    deliverable: 'Comparativo ISE + carta de identidad + plan de 90 días.',
    coachMode: 'Celebra con datos concretos, no con frases genéricas.',
  },
];

// Hábitos ancla sugeridos por eje crítico (formato if-then)
export const SUGGESTED_HABITS = {
  energia: [
    { name: 'Cierre de jornada', trigger: 'Cuando termine mi última reunión', action: 'cierro pendientes 5 min y apago el computador' },
    { name: 'Hora de sueño protegida', trigger: 'Cuando sean las 10:00 pm', action: 'dejo el celular fuera del cuarto' },
    { name: 'Pausas de recuperación', trigger: 'Cuando termine un bloque de trabajo', action: 'me levanto y me muevo 5 minutos sin pantalla' },
  ],
  claridad: [
    { name: 'Prioridades visibles', trigger: 'Cuando me siente a trabajar en la mañana', action: 'escribo mis 3 prioridades antes de abrir el correo' },
    { name: 'Revisión de norte', trigger: 'Cuando planee la semana el lunes', action: 'releo mis metas de trimestre 5 minutos' },
  ],
  foco: [
    { name: 'Primer bloque protegido', trigger: 'Cuando empiece el día laboral', action: 'hago 60 min de lo más importante sin abrir mensajes' },
    { name: 'Celular fuera', trigger: 'Cuando inicie un bloque de foco', action: 'dejo el celular en otra habitación' },
  ],
};
