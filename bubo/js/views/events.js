// Vista de cronograma y eventos (lee de JSON en GitHub)

import { showToast } from '../components/toast.js';

const EVENTS_URL = 'https://raw.githubusercontent.com/jgomezr/jgomezr.github.io/master/bubo/buboEventos.json';

let cachedEvents = null;

async function fetchEvents() {
  if (cachedEvents) return cachedEvents;

  const res = await fetch(EVENTS_URL);
  if (!res.ok) throw new Error('No se pudieron cargar los eventos');
  const data = await res.json();
  cachedEvents = data.Eventos || [];
  return cachedEvents;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

function formatDate(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getEventStatus(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return 'unknown';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return 'past';
  if (days === 0) return 'today';
  if (days <= 7) return 'soon';
  return 'upcoming';
}

function statusLabel(status) {
  switch (status) {
    case 'past': return '<span class="event-badge event-badge--past">Pasado</span>';
    case 'today': return '<span class="event-badge event-badge--today">¡Hoy!</span>';
    case 'soon': return '<span class="event-badge event-badge--soon">Próximamente</span>';
    case 'upcoming': return '<span class="event-badge event-badge--upcoming">Programado</span>';
    default: return '';
  }
}

function daysUntil(dateStr) {
  const date = parseDate(dateStr);
  if (!date) return '';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `Hace ${Math.abs(diff)} día(s)`;
  if (diff === 0) return '¡Es hoy!';
  if (diff === 1) return 'Mañana';
  return `En ${diff} días`;
}

// Colores por tipo de evento: naranja=nacional, verde=regional
function typeColor(tipo) {
  const t = (tipo || '').toLowerCase();
  if (t.includes('nacional')) return '#F25430';
  if (t.includes('regional') || t.includes('grupo') || t.includes('distrito')) return '#39AB4A';
  if (t.includes('rover')) return '#75C6CF';
  if (t.includes('servicio')) return '#F9B02F';
  return '#F24150';
}

export async function renderEvents() {
  return `
    <div class="detail-header">
      <div class="detail-header__info">
        <h1>Cronograma y Eventos</h1>
        <p class="detail-header__meta">Próximas actividades del Clan</p>
      </div>
      <div class="detail-header__actions">
        <button class="btn btn--outline" id="btn-refresh-events">
          <span class="material-icons">refresh</span> Actualizar
        </button>
      </div>
    </div>

    <div id="events-content">
      <div class="loading-screen"><div class="spinner spinner--lg"></div><p>Cargando eventos...</p></div>
    </div>
  `;
}

export async function bindEvents() {
  await loadAndRenderEvents();

  document.getElementById('btn-refresh-events')?.addEventListener('click', async () => {
    cachedEvents = null;
    await loadAndRenderEvents();
    showToast('Eventos actualizados', 'success');
  });
}

async function loadAndRenderEvents() {
  const container = document.getElementById('events-content');
  if (!container) return;

  try {
    const events = await fetchEvents();

    if (!events.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">event_busy</span>
          <p>No hay eventos programados</p>
        </div>
      `;
      return;
    }

    // Separar en próximos y pasados
    const upcoming = [];
    const past = [];

    events.forEach(ev => {
      const status = getEventStatus(ev.Fecha);
      if (status === 'past') {
        past.push({ ...ev, status });
      } else {
        upcoming.push({ ...ev, status });
      }
    });

    // Ordenar próximos por fecha ascendente
    upcoming.sort((a, b) => (parseDate(a.Fecha) || 0) - (parseDate(b.Fecha) || 0));
    // Ordenar pasados por fecha descendente
    past.sort((a, b) => (parseDate(b.Fecha) || 0) - (parseDate(a.Fecha) || 0));

    container.innerHTML = `
      ${upcoming.length > 0 ? `
        <div class="detail-section">
          <div class="detail-section__title">
            <span class="material-icons">upcoming</span>
            Próximos Eventos (${upcoming.length})
          </div>
          <div class="events-grid">
            ${upcoming.map(ev => renderEventCard(ev)).join('')}
          </div>
        </div>
      ` : ''}

      ${past.length > 0 ? `
        <div class="detail-section">
          <div class="detail-section__title">
            <span class="material-icons">history</span>
            Eventos Pasados (${past.length})
          </div>
          <div class="events-grid events-grid--past">
            ${past.map(ev => renderEventCard(ev)).join('')}
          </div>
        </div>
      ` : ''}
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">cloud_off</span>
        <p>Error al cargar eventos: ${err.message}</p>
      </div>
    `;
  }
}

function renderEventCard(ev) {
  const color = typeColor(ev.Tipo);
  const isPast = ev.status === 'past';

  return `
    <div class="event-card ${isPast ? 'event-card--past' : ''}">
      <div class="event-card__accent" style="background:${color}"></div>
      <div class="event-card__body">
        <div class="event-card__header">
          <h3 class="event-card__name">${ev.Nombre}</h3>
          ${statusLabel(ev.status)}
        </div>
        <div class="event-card__meta">
          <span class="event-card__detail">
            <span class="material-icons">calendar_today</span>
            ${formatDate(ev.Fecha)}
          </span>
          <span class="event-card__detail">
            <span class="material-icons">label</span>
            ${ev.Tipo}
          </span>
          <span class="event-card__detail">
            <span class="material-icons">schedule</span>
            ${daysUntil(ev.Fecha)}
          </span>
        </div>
      </div>
    </div>
  `;
}
