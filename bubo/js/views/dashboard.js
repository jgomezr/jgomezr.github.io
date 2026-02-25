// Dashboard del líder: stats, charts, grid de rovers

import { getState, subscribe } from '../state.js';
import { fetchAllRovers } from '../sheets.js';
import { getStageStats, getAverageCompetencies, COMPETENCY_AREAS } from '../models/rover.js';
import { renderRoverCard } from '../components/rover-card.js';
import { showToast } from '../components/toast.js';

let charts = [];

export async function renderDashboard() {
  return `
    <div class="detail-header">
      <div class="detail-header__info">
        <h1>Dashboard</h1>
        <p class="detail-header__meta">Resumen del Clan</p>
      </div>
      <div class="detail-header__actions">
        <button class="btn btn--outline" id="btn-refresh">
          <span class="material-icons">refresh</span> Actualizar
        </button>
        <a href="#/rover/new" class="btn btn--primary">
          <span class="material-icons">person_add</span> Agregar Rover
        </a>
      </div>
    </div>

    <div class="stats-grid" id="stats-grid">
      <div class="loading-screen"><div class="spinner"></div></div>
    </div>

    <div class="charts-row" id="charts-row">
      <div class="chart-container">
        <div class="chart-container__title">Rovers por etapa</div>
        <canvas id="chart-stages"></canvas>
      </div>
      <div class="chart-container">
        <div class="chart-container__title">Promedio de competencias</div>
        <canvas id="chart-competencies"></canvas>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section__title">
        <span class="material-icons">people</span>
        Rovers
      </div>
      <div class="search-bar">
        <input type="text" class="search-bar__input" id="search-rovers" placeholder="Buscar por nombre o ID...">
      </div>
      <div class="rover-grid" id="rover-grid">
        <div class="loading-screen"><div class="spinner"></div></div>
      </div>
    </div>
  `;
}

export async function bindDashboard() {
  try {
    const rovers = await fetchAllRovers();
    renderStats(rovers);
    renderCharts(rovers);
    renderGrid(rovers);
  } catch (err) {
    showToast('Error al cargar datos: ' + err.message, 'error');
  }

  document.getElementById('btn-refresh')?.addEventListener('click', async () => {
    try {
      const rovers = await fetchAllRovers(true);
      renderStats(rovers);
      renderCharts(rovers);
      renderGrid(rovers);
      showToast('Datos actualizados', 'success');
    } catch (err) {
      showToast('Error al actualizar: ' + err.message, 'error');
    }
  });

  document.getElementById('search-rovers')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const { rovers } = getState();
    const filtered = rovers.filter(r =>
      r.nombre.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );
    renderGrid(filtered);
  });
}

function renderStats(rovers) {
  const stats = getStageStats(rovers);
  const grid = document.getElementById('stats-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--total"><span class="material-icons">groups</span></div>
      <div>
        <div class="stat-card__value">${rovers.length}</div>
        <div class="stat-card__label">Total Rovers</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--ruta"><span class="material-icons">hiking</span></div>
      <div>
        <div class="stat-card__value">${(stats.ruta || 0) + (stats['ruta-completa'] || 0)}</div>
        <div class="stat-card__label">Ruta Inicial</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--rs"><span class="material-icons">star_half</span></div>
      <div>
        <div class="stat-card__value">${stats.rs || 0}</div>
        <div class="stat-card__label">Rover Scout</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--rl"><span class="material-icons">star</span></div>
      <div>
        <div class="stat-card__value">${stats.rl || 0}</div>
        <div class="stat-card__label">Rover Líder</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-card__icon stat-card__icon--bp"><span class="material-icons">military_tech</span></div>
      <div>
        <div class="stat-card__value">${stats.bp || 0}</div>
        <div class="stat-card__label">BP</div>
      </div>
    </div>
  `;
}

function renderCharts(rovers) {
  // Destruir charts previos
  charts.forEach(c => c.destroy());
  charts = [];

  if (typeof Chart === 'undefined') return;

  // Bar chart - Rovers por etapa
  const stageStats = getStageStats(rovers);
  const ctxBar = document.getElementById('chart-stages')?.getContext('2d');
  if (ctxBar) {
    charts.push(new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['Ruta Inicial', 'Rover Scout', 'Rover Líder', 'BP'],
        datasets: [{
          data: [
            (stageStats.ruta || 0) + (stageStats['ruta-completa'] || 0),
            stageStats.rs || 0,
            stageStats.rl || 0,
            stageStats.bp || 0,
          ],
          backgroundColor: ['#75C6CF', '#F9B02F', '#39AB4A', '#F24150'],
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      }
    }));
  }

  // Radar chart - Promedio de competencias
  const avgComp = getAverageCompetencies(rovers);
  const ctxRadar = document.getElementById('chart-competencies')?.getContext('2d');
  if (ctxRadar) {
    charts.push(new Chart(ctxRadar, {
      type: 'radar',
      data: {
        labels: COMPETENCY_AREAS.map(a => a.label),
        datasets: [{
          label: 'Promedio %',
          data: avgComp,
          backgroundColor: 'rgba(74, 44, 110, 0.2)',
          borderColor: '#F24150',
          pointBackgroundColor: '#F24150',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: { beginAtZero: true, max: 100, ticks: { stepSize: 25 } }
        },
        plugins: { legend: { display: false } },
      }
    }));
  }
}

function renderGrid(rovers) {
  const grid = document.getElementById('rover-grid');
  if (!grid) return;

  if (rovers.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1">
        <span class="material-icons">person_off</span>
        <p>No se encontraron rovers</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = rovers.map(r => renderRoverCard(r)).join('');
}

export function destroyDashboard() {
  charts.forEach(c => c.destroy());
  charts = [];
}
