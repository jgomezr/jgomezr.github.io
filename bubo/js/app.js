// Bootstrap principal de la aplicación

import { initAuth } from './auth.js';
import { getState, subscribe } from './state.js';
import { addRoute, startRouter, setNotFound, navigate } from './router.js';
import { renderNavbar, bindNavbar } from './components/navbar.js';
import { renderSidebar, bindSidebar } from './components/sidebar.js';
import { renderLogin, bindLogin } from './views/login.js';
import { renderDashboard, bindDashboard, destroyDashboard } from './views/dashboard.js';
import { renderRoverDetail, bindRoverDetail } from './views/rover-detail.js';
import { renderRoverForm, bindRoverForm } from './views/rover-form.js';
import { renderMyProgress, bindMyProgress } from './views/my-progress.js';
import { renderEvents, bindEvents } from './views/events.js';

const appEl = document.getElementById('app');
let currentDestroy = null;

function renderShell(contentHTML, options = {}) {
  const { user } = getState();
  const showSidebar = user && user.role === 'leader' && options.sidebar !== false;

  if (currentDestroy) {
    currentDestroy();
    currentDestroy = null;
  }

  let html = '';

  if (user) {
    html += renderNavbar();
  }

  if (showSidebar) {
    html += renderSidebar();
  }

  html += `<main class="main ${showSidebar ? 'main--with-sidebar' : ''}">${contentHTML}</main>`;

  appEl.innerHTML = html;

  if (user) {
    bindNavbar();
    if (showSidebar) bindSidebar();
  }
}

function showLoading() {
  renderShell(`
    <div class="loading-screen">
      <div class="spinner spinner--lg"></div>
      <p>Cargando...</p>
    </div>
  `);
}

// --- Rutas ---

addRoute('/login', () => {
  appEl.innerHTML = renderLogin();
  bindLogin();
});

addRoute('/dashboard', async () => {
  showLoading();
  const html = await renderDashboard();
  renderShell(html);
  await bindDashboard();
  currentDestroy = destroyDashboard;
}, { role: 'leader' });

addRoute('/eventos', async () => {
  showLoading();
  const html = await renderEvents();
  renderShell(html);
  await bindEvents();
});

addRoute('/rover/new', async () => {
  showLoading();
  const html = await renderRoverForm({});
  renderShell(html);
  bindRoverForm();
}, { role: 'leader' });

addRoute('/rover/:row/edit', async (params) => {
  showLoading();
  const html = await renderRoverForm(params);
  renderShell(html);
  bindRoverForm();
}, { role: 'leader' });

addRoute('/rover/:row', async (params) => {
  showLoading();
  const html = await renderRoverDetail(params);
  renderShell(html);
  bindRoverDetail();
}, { role: 'leader' });

addRoute('/mi-progreso', async () => {
  showLoading();
  const html = await renderMyProgress();
  renderShell(html);
  bindMyProgress();
}, { role: 'rover' });

setNotFound(() => {
  const { user } = getState();
  if (user) {
    navigate(user.role === 'leader' ? '/dashboard' : '/mi-progreso');
  } else {
    navigate('/login');
  }
});

// --- Init ---

function init() {
  initAuth();

  if (!window.location.hash) {
    const { user } = getState();
    if (user) {
      window.location.hash = user.role === 'leader' ? '/dashboard' : '/mi-progreso';
    } else {
      window.location.hash = '/login';
    }
  }

  startRouter();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

init();
