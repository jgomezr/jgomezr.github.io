// Coach IA — tres vías:
//  1) Claude API directa desde el navegador (uso personal; clave guardada localmente)
//  2) Modelo local diminuto vía WebLLM (offline/privado, tareas acotadas)
//  3) Exportar contexto al portapapeles para pegar en la app de Claude

import { db } from './db.js';
import { state, todayStr, addDays, currentWeek } from './app.js';
import { PROGRAM } from './data-program.js';
import { SABOTEURS } from './data-test.js';
import { gatherContext, dayOf } from './coach-rules.js';

/* ── contexto compartido (system prompt / export) ───────────── */

export async function buildContext() {
  const ctx = await gatherContext();
  const ego = state.alterEgo;
  const [thoughts, invocations] = await Promise.all([db.all('thoughts'), db.all('invocations')]);
  const recentThoughts = thoughts.slice(-5);

  const lines = [
    `# Contexto de ${state.settings.name} (generado por su app de coaching, ${todayStr()})`,
    '',
    ctx.lastTest
      ? `## Diagnóstico ISE\nArquetipo: ${ctx.lastTest.archetype} (${ctx.lastTest.total}/150). Claridad ${ctx.lastTest.byAxis.claridad}/50, Energía ${ctx.lastTest.byAxis.energia}/50, Foco ${ctx.lastTest.byAxis.foco}/50. Eje crítico: ${ctx.lastTest.weakest}.`
      : '## Diagnóstico ISE\nAún sin test.',
    '',
    ctx.week >= 1 && ctx.week <= 6
      ? `## Programa\nSemana ${ctx.week} de 6: ${PROGRAM[ctx.week - 1].title} — ${PROGRAM[ctx.week - 1].goal}`
      : '## Programa\nFuera del ciclo de 6 semanas.',
    '',
    `## Datos recientes`,
    `Sueño (hoy): ${ctx.sleepToday ?? 's/d'} h. Energía am últimos 3 días: ${ctx.energyLast3.join(', ') || 's/d'}. FC reposo: ${ctx.hrLast3.join(', ') || 's/d'}. Bloques de foco esta semana: ${ctx.focusThisWeek}. Registros de saboteadores (7d): ${ctx.saboteurCount7d}.`,
    '',
    ego
      ? `## Alter ego\n"${ego.name}": ${(ego.traits || []).join(', ')}. Decide así: ${ego.decides}. Protege: ${ego.protects}. Frase: "${ego.phrase}". Tótem: ${ego.totem}.`
      : '## Alter ego\nAún no creado (se crea en semana 4).',
    '',
    recentThoughts.length
      ? `## Saboteadores recientes\n${recentThoughts.map((t) => `- [${t.saboteur}] "${t.phrase}" (${dayOf(t)})`).join('\n')}`
      : '',
    invocations.length ? `\nInvocaciones del alter ego: ${invocations.length} en total.` : '',
  ];
  return lines.filter((l) => l !== '').join('\n');
}

export function systemPrompt(context) {
  const ego = state.alterEgo;
  return `Eres el coach personal de ${state.settings.name}, dentro de su app "Brasa". Trabajas con el método de su programa de 6 semanas (Ser→Hacer→Tener) y SOLO con técnicas de evidencia: intenciones de implementación (if-then), WOOP, reencuadre cognitivo, defusión (nombrar el saboteador), self-talk distanciado${ego ? ` (invocar a "${ego.name}")` : ` (usar su nombre propio)`}, principio del progreso, y protección de sueño/pausas.

Reglas duras:
- Nada de motivación genérica ni frases de póster. Usa SUS datos (abajo) en cada intervención.
- Su perfil es autoexigente (Constructor): tu trabajo es que SUELTE, no que haga más. Frena el sobre-diseño y el perfeccionismo.
- Respuestas cortas (3-6 frases), directas, en español, tuteo. Una sola pregunta por turno máximo.
- Si detectas lenguaje saboteador, nómbralo (defusión) y ofrece el reencuadre.
- Si los datos muestran sueño <6h o energía ≤2 sostenida, la prioridad es recuperación — recorta el plan, no lo empujes.
- Saboteadores posibles: ${SABOTEURS.map((s) => s.name).join(', ')}.

${context}`;
}

/* ── vía 1: Claude API directa ──────────────────────────────── */

export async function askClaude(messages, { signal } = {}) {
  const key = state.settings.apiKey;
  if (!key) throw new Error('Configura tu clave de API en Ajustes.');
  const context = await buildContext();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: state.settings.model || 'claude-opus-5',
      max_tokens: 2048,
      output_config: { effort: state.settings.effort || 'low' },
      system: systemPrompt(context),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Error de API (${res.status})`);
  }
  const data = await res.json();
  if (data.stop_reason === 'refusal') {
    return 'La API declinó responder esto. Reformúlalo o usa el botón de copiar contexto para conversarlo en la app de Claude.';
  }
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return text || '(respuesta vacía)';
}

/* ── vía 2: modelo local (WebLLM, opcional) ─────────────────── */

let localEngine = null;
export const LOCAL_MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export async function askLocal(messages, onProgress) {
  if (!localEngine) {
    onProgress?.('Descargando modelo local (~350 MB la primera vez)…');
    const webllm = await import('https://esm.run/@mlc-ai/web-llm');
    localEngine = await webllm.CreateMLCEngine(LOCAL_MODEL, {
      initProgressCallback: (p) => onProgress?.(p.text || `Cargando… ${Math.round((p.progress || 0) * 100)}%`),
    });
  }
  const context = await buildContext();
  const reply = await localEngine.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt(context) + '\n\nIMPORTANTE: responde en máximo 3 frases.' },
      ...messages.map((m) => ({ role: m.role, content: contentText(m) })),
    ],
    max_tokens: 220,
  });
  return reply.choices?.[0]?.message?.content || '(sin respuesta del modelo local)';
}

const contentText = (m) => (typeof m.content === 'string' ? m.content : m.content.map((b) => b.text || '').join(''));

/* ── vía 3: exportar contexto ───────────────────────────────── */

export async function exportForClaude(topic = '') {
  const context = await buildContext();
  const prompt = `${systemPrompt(context)}

---
Quiero conversar contigo como mi coach con todo ese contexto.${topic ? `\nTema: ${topic}` : '\nEmpecemos: pregúntame qué necesito hoy.'}`;
  await navigator.clipboard.writeText(prompt);
  return prompt.length;
}
