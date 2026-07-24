// Motor de reglas del coach — cada regla implementa una técnica con evidencia
// (ver insumos/04): automonitoreo+feedback, if-then, WOOP, defusión, distanciamiento.
// Sin modelo: puro código sobre los datos del usuario.

import { db } from './db.js';
import { state, todayStr, addDays, currentWeek } from './app.js';
import { PROGRAM } from './data-program.js';

const USER = () => state.settings?.name || 'Julián';
const EGO = () => state.alterEgo?.name || null;

// Día local de un registro (los timestamps ISO son UTC y corren la fecha de noche).
export const dayOf = (r) => r.day || (r.date || '').slice(0, 10);

// Lunes de la semana actual (la "semana" del programa va de lunes a domingo).
export function mondayStr() {
  const d = new Date(todayStr() + 'T12:00:00');
  const shift = (d.getDay() + 6) % 7; // lun=0 … dom=6
  return addDays(todayStr(), -shift);
}

/* Recolecta el contexto de datos reciente que las reglas evalúan. */
export async function gatherContext() {
  const today = todayStr();
  const days7 = [...Array(7)].map((_, i) => addDays(today, -i));
  const [checkins, ring, habits, habitLogs, focus, tests, thoughts] = await Promise.all([
    db.all('checkins'), db.all('ring'), db.all('habits'),
    db.all('habit_logs'), db.all('focus'), db.all('tests'), db.all('thoughts'),
  ]);
  const ci = {};
  checkins.forEach((c) => (ci[c.key] = c));
  const ringByDate = {};
  ring.forEach((r) => (ringByDate[r.date] = r));

  const sleepOf = (d) => ci[`${d}:am`]?.sleepH ?? ringByDate[d]?.sleepH ?? null;
  const energyAM = (d) => ci[`${d}:am`]?.energia ?? null;

  const activeHabits = habits.filter((x) => x.active !== false);
  const logIdx = {};
  habitLogs.forEach((l) => (logIdx[l.key] = l));

  return {
    today,
    dow: new Date().getDay(), // 0=dom, 1=lun
    hour: new Date().getHours(),
    week: currentWeek(),
    amToday: ci[`${today}:am`] || null,
    pmYesterday: ci[`${addDays(today, -1)}:pm`] || null,
    sleepToday: sleepOf(today),
    sleepLast3: [0, 1, 2].map((i) => sleepOf(addDays(today, -i))).filter((v) => v != null),
    energyLast3: [0, 1, 2].map((i) => energyAM(addDays(today, -i))).filter((v) => v != null),
    hrLast3: [0, 1, 2].map((i) => ci[`${addDays(today, -i)}:am`]?.restingHR ?? ringByDate[addDays(today, -i)]?.restingHR).filter((v) => v != null),
    habitMisses: activeHabits.map((hb) => ({
      habit: hb,
      // solo cuentan días en que el hábito ya existía
      missedDays: days7.slice(1, 4)
        .filter((d) => (!hb.createdAt || d >= hb.createdAt) && !logIdx[`${d}:${hb.id}`]?.done).length,
    })),
    focusThisWeek: focus.filter((f) => f.done && f.date >= mondayStr()).length,
    lastTest: tests.sort((a, b) => a.date.localeCompare(b.date)).at(-1) || null,
    daysSinceTest: tests.length
      ? Math.floor((Date.now() - new Date(tests.at(-1).date)) / 86400000)
      : null,
    saboteurCount7d: thoughts.filter((t) => days7.includes(dayOf(t))).length,
    checkinsTotal: checkins.length,
  };
}

/* Reglas en orden de prioridad. Cada una: test(ctx) → mensaje | null.
   action opcional: { label, run } */
const RULES = [
  {
    id: 'no-test',
    test: (c) => !c.lastTest && {
      text: 'Antes de optimizar hay que medir. Tu primer paso es el test ISE: 30 preguntas honestas y tenemos tu línea base.',
      action: { label: 'Hacer el test', run: () => (location.hash = '#/test') },
    },
  },
  {
    id: 'sleep-crisis',
    test: (c) => c.sleepToday != null && c.sleepToday < 6 && {
      text: `Dormiste ${c.sleepToday} horas. El problema de hoy no es motivación, es recuperación. Recorta el plan a la mitad: LA tarea y nada más. Y esta noche, la hora de sueño se protege primero.`,
    },
  },
  {
    id: 'hr-elevated',
    test: (c) => c.hrLast3.length >= 3 && Math.min(...c.hrLast3) > 68 && {
      text: `Tu frecuencia en reposo lleva 3 días alta (${c.hrLast3.join(', ')}). Tu cuerpo está pidiendo una semana de recuperación: menos carga, más pausas, cero heroísmo.`,
    },
  },
  {
    id: 'habit-relapse',
    test: (c) => {
      const broken = c.habitMisses.find((h) => h.missedDays >= 3);
      return broken && {
        text: `"${broken.habit.name}" lleva 3 días caído. Sin drama: el plan de recaída existe para esto. Hoy la versión mínima cuenta — hacerlo pequeño vale más que planearlo perfecto.`,
      };
    },
  },
  {
    id: 'energy-low-streak',
    test: (c) => c.energyLast3.length >= 3 && Math.max(...c.energyLast3) <= 2 && {
      text: `Tres mañanas seguidas con energía en el piso. Eso no se resuelve empujando más. Revisa: ¿sueño?, ¿pausas reales?, ¿algo drenando que no has soltado? Cuéntamelo en el chat si quieres desenredarlo.`,
      action: { label: 'Ir al coach', run: () => (location.hash = '#/coach') },
    },
  },
  {
    id: 'monday-woop',
    test: (c) => c.dow === 1 && c.hour < 14 && {
      text: 'Es lunes. Treinta minutos de planeación te ahorran una semana de reacción: 3 resultados, sus obstáculos internos, y los bloques agendados primero.',
      action: { label: 'Planear la semana (WOOP)', run: () => (location.hash = '#/coach?flow=woop') },
    },
  },
  {
    id: 'no-am-checkin',
    test: (c) => !c.amToday && c.hour >= 8 && c.hour < 13 && {
      text: 'El día todavía no tiene dueño. Dos minutos: energía, sueño, y LA tarea que hace que hoy valga.',
    },
  },
  {
    id: 'no-avance-yesterday',
    test: (c) => c.pmYesterday && c.pmYesterday.avance === false && {
      text: EGO()
        ? `Ayer no hubo avance en lo importante. Pregunta de hoy: ¿qué haría ${EGO()} distinto en las próximas 2 horas?`
        : `Ayer no hubo avance en lo importante. ${USER()}, si alguien de tu equipo te contara eso, ¿qué le dirías? Aplícatelo.`,
    },
  },
  {
    id: 'focus-week5',
    test: (c) => c.week === 5 && c.focusThisWeek < 5 && c.dow >= 4 && {
      text: `Semana de sistemas: llevas ${c.focusThisWeek}/5 bloques de foco. Agenda los que faltan como si fueran reuniones con tu mejor cliente — porque lo son.`,
      action: { label: 'Iniciar bloque de foco', run: () => (location.hash = '#/foco') },
    },
  },
  {
    id: 'retest-due',
    test: (c) => c.daysSinceTest != null && c.daysSinceTest >= 30 && {
      text: `Hace ${c.daysSinceTest} días no mides. Lo que no se mide se cuenta historias: re-test ISE de 6 minutos y comparamos contra tu línea base.`,
      action: { label: 'Re-test ISE', run: () => (location.hash = '#/test') },
    },
  },
  {
    id: 'week-goal',
    test: (c) => c.week >= 1 && c.week <= 6 && {
      text: `${PROGRAM[c.week - 1].goal} — ese es el foco de esta semana. Un ejercicio hoy es suficiente avance.`,
      action: { label: 'Ver la semana', run: () => (location.hash = '#/programa') },
    },
  },
  {
    id: 'default',
    test: () => ({
      text: 'Sin alertas hoy. Protege el primer bloque de la mañana para lo importante — todo lo demás puede esperar 90 minutos.',
    }),
  },
];

let cachedMsg = null;
export async function dailyMessage() {
  const hour = new Date().getHours();
  if (cachedMsg && cachedMsg.date === todayStr() && cachedMsg.hour === hour) return cachedMsg.msg;
  const ctx = await gatherContext();
  for (const rule of RULES) {
    const m = rule.test(ctx);
    if (m) {
      cachedMsg = { date: todayStr(), hour, msg: m };
      return m;
    }
  }
  return null;
}

/* ── flujos guiados (formularios conversacionales, sin IA) ───── */

export const FLOWS = {
  woop: {
    title: 'Planeación semanal (WOOP)',
    intro: 'Contraste mental de Oettingen: deseo, resultado, obstáculo interno, plan. Una prioridad a la vez.',
    steps: [
      { id: 'wish', q: '¿Cuál es EL resultado más importante de esta semana? (uno, concreto)' },
      { id: 'outcome', q: 'Si el viernes eso está logrado, ¿qué cambia? Descríbelo un momento como si ya pasó.' },
      { id: 'obstacle', q: 'Ahora lo clave: ¿cuál es TU obstáculo interno más probable? (no el mundo — tú: postergar, sobre-pulir, decir sí a otros...)' },
      { id: 'plan', q: 'Cierra el if-then: "Si aparece [tu obstáculo], entonces yo..."' },
      { id: 'block', q: '¿Qué día y hora agendas el primer bloque de 90 min para esto? Escríbelo y ponlo en tu calendario AHORA.' },
    ],
    close: (a) => `Plan armado:\n\n· Resultado: ${a.wish}\n· Obstáculo interno: ${a.obstacle}\n· If-then: ${a.plan}\n· Primer bloque: ${a.block}\n\nEso es todo lo que necesitas. El resto de la semana es ejecutar, no re-planear.`,
  },
  reframe: {
    title: 'Reencuadre de saboteador',
    intro: 'Defusión + reevaluación cognitiva: nombrar el patrón le quita poder; reencuadrarlo lo convierte en información.',
    steps: [
      { id: 'phrase', q: '¿Qué te acabas de decir? Escríbelo literal, sin suavizarlo.' },
      { id: 'situation', q: '¿En qué situación apareció?' },
      { id: 'label', q: '¿Cuál de tus saboteadores suena así? (perfeccionista, complaciente, hiperracional, hiperlogro, víctima, controlador)' },
      { id: 'reframe', q: 'Ahora la versión del mentor exigente pero justo: mismos hechos, sin el castigo. ¿Cómo lo diría él?' },
    ],
    close: (a) => `Registrado. "${a.phrase}" era tu ${a.label} hablando — no eran los hechos.\n\nTu reencuadre: ${a.reframe}\n\nCada vez que lo nombras, pierde fuerza. Quedó guardado en tu registro de saboteadores.`,
    save: async (a) => {
      const { matchSaboteur } = await import('./data-test.js');
      await db.put('thoughts', {
        date: new Date().toISOString(),
        day: todayStr(),
        phrase: a.phrase, situation: a.situation,
        saboteur: matchSaboteur(a.label) || (a.label || '').toLowerCase().trim(),
        reframe: a.reframe,
      });
    },
  },
  cierre: {
    title: 'Cierre de día guiado',
    intro: 'Principio del progreso: el cierre siempre encuentra un avance real, por pequeño que sea.',
    steps: [
      { id: 'win', q: '¿Cuál fue UN avance real de hoy? (por pequeño que sea — cuenta)' },
      { id: 'drop', q: '¿Qué no salió y decides soltar? (soltar ≠ olvidar: es no cargarlo esta noche)' },
      { id: 'tomorrow', q: '¿Cuál es LA tarea de mañana? Decidida ahora, no mañana a las 8 am.' },
    ],
    close: (a) => `Día cerrado.\n\n✓ Avance: ${a.win}\n↓ Soltado: ${a.drop}\n→ Mañana: ${a.tomorrow}\n\nLo de hoy ya fue. Ve a descansar — la recuperación también es trabajo.`,
  },
};
