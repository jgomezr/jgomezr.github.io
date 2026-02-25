// Formulario para agregar/editar rover

import { getState } from '../state.js';
import { fetchAllRovers, addRover, updateRoverRow } from '../sheets.js';
import { RUTA_INICIAL_ITEMS, COMPETENCY_AREAS, MAX_COMP_SCORE } from '../models/rover.js';
import { showToast } from '../components/toast.js';
import { navigate } from '../router.js';

let editingRover = null;

function scoreOptions(current) {
  let html = '<option value="0"' + (current === 0 ? ' selected' : '') + '>Sin evaluar</option>';
  for (let i = 1; i <= MAX_COMP_SCORE; i++) {
    html += `<option value="${i}"${current === i ? ' selected' : ''}>${i}</option>`;
  }
  return html;
}

export async function renderRoverForm(params) {
  const isEdit = params && params.row;
  editingRover = null;

  if (isEdit) {
    const row = parseInt(params.row);
    let rovers = getState().rovers;
    if (!rovers.length) rovers = await fetchAllRovers();
    editingRover = rovers.find(r => r.row === row);
    if (!editingRover) {
      return `<div class="empty-state"><p>Rover no encontrado</p></div>`;
    }
  }

  const r = editingRover;
  const title = isEdit ? `Editar: ${r.nombre}` : 'Agregar Rover';

  return `
    <div class="detail-header">
      <div class="detail-header__info">
        <h1>${title}</h1>
      </div>
      <div class="detail-header__actions">
        <a href="#/${isEdit ? 'rover/' + params.row : 'dashboard'}" class="btn btn--outline">
          <span class="material-icons">arrow_back</span> Cancelar
        </a>
      </div>
    </div>

    <form id="rover-form" class="card">
      <div class="card__body">
        <!-- Datos personales -->
        <h3 style="margin-bottom:var(--space-md)">Datos Personales</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-md)">
          <div class="form-group">
            <label class="form-label" for="f-id">Identificación *</label>
            <input type="text" id="f-id" class="form-input" value="${r?.id || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-nombre">Nombre *</label>
            <input type="text" id="f-nombre" class="form-input" value="${r?.nombre || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="f-correo">Correo *</label>
            <input type="email" id="f-correo" class="form-input" value="${r?.correo || ''}" required>
          </div>
        </div>

        <!-- Ruta Inicial -->
        <h3 style="margin:var(--space-xl) 0 var(--space-md)">Ruta Inicial</h3>
        <div class="checklist">
          ${RUTA_INICIAL_ITEMS.map((name, i) => `
            <label class="checkbox">
              <input type="checkbox" name="ruta-${i}" ${r?.rutaInicial[i]?.completed ? 'checked' : ''}>
              ${name}
            </label>
          `).join('')}
        </div>

        <!-- Uniforme -->
        <h3 style="margin:var(--space-xl) 0 var(--space-md)">Uniforme</h3>
        <div class="form-group">
          <label class="form-label" for="f-uniforme">Fecha de uniforme</label>
          <input type="text" id="f-uniforme" class="form-input" placeholder="DD/MM/AAAA" value="${r?.uniforme || ''}">
        </div>

        <!-- Competencias -->
        <h3 style="margin:var(--space-xl) 0 var(--space-md)">Competencias (nivel 1-5)</h3>
        ${COMPETENCY_AREAS.map(area => {
          const items = r?.competencias[area.key] || [{score:0}, {score:0}, {score:0}];
          return `
            <div style="margin-bottom:var(--space-lg)">
              <strong>${area.label}</strong>
              <div class="comp-rating-group">
                ${[0, 1, 2].map(i => `
                  <div class="comp-rating">
                    <span class="comp-rating__label">${area.subs[i]}</span>
                    <select class="comp-rating__select"
                            name="comp-${area.key}-${i}">
                      ${scoreOptions(items[i]?.score || 0)}
                    </select>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}

        <!-- Clubes -->
        <h3 style="margin:var(--space-xl) 0 var(--space-md)">Clubes y Programa</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-md)">
          <div class="form-group">
            <label class="form-label" for="f-club1">Club 1</label>
            <input type="text" id="f-club1" class="form-input" value="${r?.club1 || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="f-club2">Club 2</label>
            <input type="text" id="f-club2" class="form-input" value="${r?.club2 || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="f-programa">Programa alterno</label>
            <input type="text" id="f-programa" class="form-input" value="${r?.programaAlterno || ''}">
          </div>
        </div>

        <!-- Hitos -->
        <h3 style="margin:var(--space-xl) 0 var(--space-md)">Hitos de Progresión</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--space-md)">
          <div class="form-group">
            <label class="form-label" for="f-rs">Rover Scout (fecha)</label>
            <input type="text" id="f-rs" class="form-input" placeholder="DD/MM/AAAA" value="${r?.hitoRS || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="f-rl">Rover Líder (fecha)</label>
            <input type="text" id="f-rl" class="form-input" placeholder="DD/MM/AAAA" value="${r?.hitoRL || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" for="f-bp">BP (fecha)</label>
            <input type="text" id="f-bp" class="form-input" placeholder="DD/MM/AAAA" value="${r?.hitoBP || ''}">
          </div>
        </div>
      </div>

      <div class="card__footer">
        <button type="submit" class="btn btn--primary btn--lg" id="btn-save">
          <span class="material-icons">save</span>
          ${isEdit ? 'Guardar Cambios' : 'Agregar Rover'}
        </button>
      </div>
    </form>
  `;
}

export function bindRoverForm() {
  const form = document.getElementById('rover-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;

    try {
      const values = collectFormValues();

      if (editingRover) {
        await updateRoverRow(editingRover.row, values);
        showToast('Rover actualizado', 'success');
        navigate(`/rover/${editingRover.row}`);
      } else {
        await addRover(values);
        showToast('Rover agregado', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
      btn.disabled = false;
    }
  });
}

function collectFormValues() {
  const row = new Array(41).fill('');

  row[0] = document.getElementById('f-id').value.trim();
  row[1] = document.getElementById('f-nombre').value.trim();
  row[2] = document.getElementById('f-correo').value.trim();

  if (!row[0] || !row[1] || !row[2]) {
    throw new Error('ID, Nombre y Correo son obligatorios');
  }

  // Ruta inicial
  for (let i = 0; i < 16; i++) {
    const cb = document.querySelector(`input[name="ruta-${i}"]`);
    row[3 + i] = cb?.checked ? 'TRUE' : 'FALSE';
  }

  row[19] = document.getElementById('f-uniforme').value.trim();

  // Competencias (valor numérico 0-5)
  for (const area of COMPETENCY_AREAS) {
    for (let i = 0; i < 3; i++) {
      const sel = document.querySelector(`select[name="comp-${area.key}-${i}"]`);
      row[area.indices[i]] = sel ? parseInt(sel.value) : 0;
    }
  }

  row[35] = document.getElementById('f-club1').value.trim();
  row[36] = document.getElementById('f-club2').value.trim();
  row[37] = document.getElementById('f-programa').value.trim();
  row[38] = document.getElementById('f-rs').value.trim();
  row[39] = document.getElementById('f-rl').value.trim();
  row[40] = document.getElementById('f-bp').value.trim();

  return row;
}
