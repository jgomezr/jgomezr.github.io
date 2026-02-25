// Vista de progreso personal del rover (read-only)

import { getState } from '../state.js';
import { fetchAllRovers } from '../sheets.js';
import {
  getCurrentStage, getRutaInicialProgress, getCompetencyProgress,
  getAllCompetenciesProgress, getOverallProgress, COMPETENCY_AREAS, MAX_COMP_SCORE
} from '../models/rover.js';
import { renderProgressRing } from '../components/progress-ring.js';

const MOTIVATIONAL_MESSAGES = {
  ruta: {
    title: '¡Estás en camino!',
    text: 'Cada paso en la Ruta Inicial te acerca más a convertirte en Rover Scout. ¡Sigue adelante!',
  },
  'ruta-completa': {
    title: '¡Ruta Inicial completa!',
    text: 'Has completado tu Ruta Inicial. Ahora enfócate en desarrollar tus competencias para alcanzar el hito de Rover Scout.',
  },
  rs: {
    title: '¡Eres Rover Scout!',
    text: 'Felicidades por tu logro. Sigue creciendo en tus competencias para convertirte en Rover Líder.',
  },
  rl: {
    title: '¡Rover Líder!',
    text: 'Tu compromiso te ha llevado lejos. El camino hacia el BP es el máximo reconocimiento.',
  },
  bp: {
    title: '¡BP!',
    text: 'Has alcanzado el máximo reconocimiento rover. Tu ejemplo inspira a los que vienen detrás.',
  },
};

function renderScoreDots(score) {
  let html = '<span class="score-dots">';
  for (let i = 1; i <= MAX_COMP_SCORE; i++) {
    html += `<span class="score-dot ${i <= score ? 'score-dot--filled' : ''}"></span>`;
  }
  html += '</span>';
  return html;
}

export async function renderMyProgress() {
  const { user } = getState();
  if (!user || user.role !== 'rover') {
    return `<div class="empty-state"><p>Acceso no autorizado</p></div>`;
  }

  let rovers = getState().rovers;
  if (!rovers.length) {
    try {
      rovers = await fetchAllRovers();
    } catch (err) {
      return `<div class="empty-state"><p>Error al cargar datos</p></div>`;
    }
  }

  const rover = rovers.find(r => r.row === user.row);
  if (!rover) {
    return `<div class="empty-state"><p>No se encontraron tus datos</p></div>`;
  }

  const stage = getCurrentStage(rover);
  const overall = getOverallProgress(rover);
  const rutaProg = getRutaInicialProgress(rover);
  const compProg = getAllCompetenciesProgress(rover);
  const msg = MOTIVATIONAL_MESSAGES[stage.key] || MOTIVATIONAL_MESSAGES.ruta;

  // ¿Qué falta?
  const missing = [];
  if (rutaProg.percent < 100) {
    const pending = rover.rutaInicial.filter(i => !i.completed).map(i => i.name);
    missing.push({ area: 'Ruta Inicial', items: pending });
  }
  for (const area of COMPETENCY_AREAS) {
    const items = rover.competencias[area.key] || [];
    const lowItems = items
      .map((item, i) => ({ name: area.subs[i], score: item.score }))
      .filter(x => x.score < MAX_COMP_SCORE);
    if (lowItems.length > 0) {
      missing.push({
        area: area.label,
        items: lowItems.map(x => `${x.name}: nivel ${x.score}/${MAX_COMP_SCORE}`),
      });
    }
  }

  return `
    <!-- Mensaje motivacional -->
    <div class="motivation">
      <div class="motivation__title">${msg.title}</div>
      <div class="motivation__text">${msg.text}</div>
    </div>

    <!-- Resumen -->
    <div style="display:flex;align-items:center;gap:var(--space-xl);flex-wrap:wrap;margin-bottom:var(--space-xl)">
      <div style="text-align:center">
        ${renderProgressRing(overall.percent, 120, 10)}
        <p style="margin-top:var(--space-sm);font-weight:600">Progreso General</p>
      </div>
      <div style="flex:1;min-width:200px">
        <h1 style="margin-bottom:var(--space-xs)">${rover.nombre}</h1>
        <p style="color:var(--color-text-secondary)">ID: ${rover.id}</p>
        <span class="badge ${stage.badge}" style="margin-top:var(--space-sm)">${stage.label}</span>
      </div>
    </div>

    <!-- Ruta Inicial -->
    <div class="detail-section">
      <div class="detail-section__title">
        <span class="material-icons">route</span>
        Ruta Inicial (${rutaProg.done}/${rutaProg.total})
      </div>
      <div class="progress-bar" style="margin-bottom:var(--space-md)">
        <div class="progress-bar__fill ${rutaProg.percent === 100 ? 'progress-bar__fill--success' : ''}"
             style="width:${rutaProg.percent}%"></div>
      </div>
      <div class="checklist">
        ${rover.rutaInicial.map(item => `
          <label class="checkbox checkbox--disabled">
            <input type="checkbox" ${item.completed ? 'checked' : ''} disabled>
            ${item.name}
          </label>
        `).join('')}
      </div>
    </div>

    <!-- Competencias -->
    <div class="detail-section">
      <div class="detail-section__title">
        <span class="material-icons">psychology</span>
        Competencias (${compProg.score}/${compProg.max} pts &middot; ${compProg.percent}%)
      </div>
      <div class="progress-bar" style="margin-bottom:var(--space-md)">
        <div class="progress-bar__fill progress-bar__fill--accent" style="width:${compProg.percent}%"></div>
      </div>
      ${COMPETENCY_AREAS.map(area => {
        const prog = getCompetencyProgress(rover, area.key);
        const items = rover.competencias[area.key] || [];
        return `
          <div class="accordion__item">
            <button class="accordion__header">
              <span>${area.label} (${prog.score}/${prog.max})</span>
              <span class="material-icons accordion__icon">expand_more</span>
            </button>
            <div class="accordion__body">
              ${items.map((item, i) => `
                <div class="comp-rating comp-rating--readonly">
                  <span class="comp-rating__label">${area.subs[i]}</span>
                  ${renderScoreDots(item.score)}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Clubes -->
    <div class="detail-section">
      <div class="detail-section__title">
        <span class="material-icons">interests</span>
        Clubes y Programa
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-md)">
        <div><strong>Club 1:</strong><p>${rover.club1 || '—'}</p></div>
        <div><strong>Club 2:</strong><p>${rover.club2 || '—'}</p></div>
        <div><strong>Programa alterno:</strong><p>${rover.programaAlterno || '—'}</p></div>
      </div>
    </div>

    <!-- Hitos -->
    <div class="detail-section">
      <div class="detail-section__title">
        <span class="material-icons">emoji_events</span>
        Hitos de Progresión
      </div>
      <div class="timeline">
        ${[
          { label: 'Rover Scout', date: rover.hitoRS },
          { label: 'Rover Líder', date: rover.hitoRL },
          { label: 'Baden Powell', date: rover.hitoBP },
        ].map(h => `
          <div class="timeline__item">
            <div class="timeline__dot ${h.date ? 'timeline__dot--done' : 'timeline__dot--pending'}">
              <span class="material-icons" style="font-size:16px">${h.date ? 'check' : 'remove'}</span>
            </div>
            <div>
              <div class="timeline__label">${h.label}</div>
              <div class="timeline__date">${h.date || 'Pendiente'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ¿Qué falta? -->
    ${missing.length > 0 ? `
      <div class="detail-section">
        <div class="detail-section__title">
          <span class="material-icons">checklist</span>
          ¿Qué te falta?
        </div>
        <div class="card">
          <div class="card__body">
            ${missing.map(m => `
              <div style="margin-bottom:var(--space-md)">
                <strong>${m.area}:</strong>
                <ul style="margin-top:var(--space-xs);padding-left:var(--space-lg);list-style:disc">
                  ${m.items.map(i => `<li style="color:var(--color-text-secondary);font-size:var(--font-size-sm)">${i}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

export function bindMyProgress() {
  document.querySelectorAll('.accordion__header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('accordion__item--open');
    });
  });
}
