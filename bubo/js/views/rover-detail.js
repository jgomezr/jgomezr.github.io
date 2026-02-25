// Vista detalle de un rover (líder - editable)

import { getState } from '../state.js';
import { fetchAllRovers, updateCell } from '../sheets.js';
import {
  getCurrentStage, getRutaInicialProgress, getCompetencyProgress,
  getAllCompetenciesProgress, COMPETENCY_AREAS, MAX_COMP_SCORE
} from '../models/rover.js';
import { renderProgressRing } from '../components/progress-ring.js';
import { showToast } from '../components/toast.js';
import { showConfirm } from '../components/modal.js';
import { deleteRover } from '../sheets.js';
import { navigate } from '../router.js';

let currentRover = null;

function scoreOptions(current) {
  let html = '<option value="0"' + (current === 0 ? ' selected' : '') + '>Sin evaluar</option>';
  for (let i = 1; i <= MAX_COMP_SCORE; i++) {
    html += `<option value="${i}"${current === i ? ' selected' : ''}>${i}</option>`;
  }
  return html;
}

export async function renderRoverDetail(params) {
  const row = parseInt(params.row);
  let rovers = getState().rovers;
  if (!rovers.length) {
    rovers = await fetchAllRovers();
  }

  currentRover = rovers.find(r => r.row === row);
  if (!currentRover) {
    return `
      <div class="empty-state">
        <span class="material-icons">person_off</span>
        <p>Rover no encontrado</p>
        <a href="#/dashboard" class="btn btn--primary" style="margin-top:var(--space-md)">Volver al Dashboard</a>
      </div>
    `;
  }

  const stage = getCurrentStage(currentRover);
  const rutaProg = getRutaInicialProgress(currentRover);
  const compProg = getAllCompetenciesProgress(currentRover);

  return `
    <div class="detail-header">
      <div class="detail-header__info">
        <h1>${currentRover.nombre}</h1>
        <div class="detail-header__meta">
          ID: ${currentRover.id} &middot; ${currentRover.correo}
          <span class="badge ${stage.badge}" style="margin-left:var(--space-sm)">${stage.label}</span>
        </div>
      </div>
      <div class="detail-header__actions">
        <a href="#/dashboard" class="btn btn--outline">
          <span class="material-icons">arrow_back</span> Volver
        </a>
        <a href="#/rover/${row}/edit" class="btn btn--primary">
          <span class="material-icons">edit</span> Editar
        </a>
        <button class="btn btn--danger" id="btn-delete-rover">
          <span class="material-icons">delete</span> Eliminar
        </button>
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
      <div class="checklist" id="checklist-ruta">
        ${currentRover.rutaInicial.map((item) => `
          <label class="checkbox">
            <input type="checkbox" ${item.completed ? 'checked' : ''}
                   data-row="${row}" data-col="${item.col}" data-type="ruta">
            ${item.name}
          </label>
        `).join('')}
      </div>
    </div>

    <!-- Uniforme -->
    <div class="detail-section">
      <div class="detail-section__title">
        <span class="material-icons">checkroom</span>
        Uniforme
      </div>
      <p>${currentRover.uniforme || '<span style="color:var(--color-text-light)">Sin fecha</span>'}</p>
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
      <div id="competency-accordion">
        ${COMPETENCY_AREAS.map(area => {
          const prog = getCompetencyProgress(currentRover, area.key);
          const items = currentRover.competencias[area.key] || [];
          return `
            <div class="accordion__item">
              <button class="accordion__header">
                <span>${area.label} (${prog.score}/${prog.max})</span>
                <span class="material-icons accordion__icon">expand_more</span>
              </button>
              <div class="accordion__body">
                ${items.map((item, i) => `
                  <div class="comp-rating">
                    <span class="comp-rating__label">${area.subs[i]}</span>
                    <select class="comp-rating__select"
                            data-row="${row}" data-col="${item.col}" data-type="comp">
                      ${scoreOptions(item.score)}
                    </select>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Clubes y Programa -->
    <div class="detail-section">
      <div class="detail-section__title">
        <span class="material-icons">interests</span>
        Clubes y Programa
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-md)">
        <div><strong>Club 1:</strong><p>${currentRover.club1 || '—'}</p></div>
        <div><strong>Club 2:</strong><p>${currentRover.club2 || '—'}</p></div>
        <div><strong>Programa alterno:</strong><p>${currentRover.programaAlterno || '—'}</p></div>
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
          { label: 'Rover Scout', date: currentRover.hitoRS },
          { label: 'Rover Líder', date: currentRover.hitoRL },
          { label: 'BP', date: currentRover.hitoBP },
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
  `;
}

export function bindRoverDetail() {
  // Checkboxes de ruta inicial
  document.querySelectorAll('input[data-type="ruta"]').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      const value = e.target.checked ? 'TRUE' : 'FALSE';
      try {
        await updateCell(row, col, value);
        showToast('Actualizado', 'success');
      } catch (err) {
        e.target.checked = !e.target.checked;
        showToast('Error al actualizar: ' + err.message, 'error');
      }
    });
  });

  // Dropdowns de competencias
  document.querySelectorAll('select[data-type="comp"]').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const row = parseInt(e.target.dataset.row);
      const col = parseInt(e.target.dataset.col);
      const value = parseInt(e.target.value);
      const prev = e.target.getAttribute('data-prev') || e.target.value;

      try {
        await updateCell(row, col, value);
        e.target.setAttribute('data-prev', value);
        showToast('Actualizado', 'success');
      } catch (err) {
        e.target.value = prev;
        showToast('Error al actualizar: ' + err.message, 'error');
      }
    });
  });

  // Acordeón
  document.querySelectorAll('.accordion__header').forEach(header => {
    header.addEventListener('click', () => {
      header.parentElement.classList.toggle('accordion__item--open');
    });
  });

  // Eliminar rover
  document.getElementById('btn-delete-rover')?.addEventListener('click', async () => {
    if (!currentRover) return;
    const confirmed = await showConfirm(
      'Eliminar Rover',
      `¿Estás seguro de que deseas eliminar a ${currentRover.nombre}? Esta acción no se puede deshacer.`
    );
    if (confirmed) {
      try {
        await deleteRover(currentRover.row);
        showToast('Rover eliminado', 'success');
        navigate('/dashboard');
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      }
    }
  });
}
