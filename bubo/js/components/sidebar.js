// Sidebar de navegación (solo para líderes)

import { getCurrentPath } from '../router.js';

export function renderSidebar() {
  const path = getCurrentPath();

  return `
    <aside class="sidebar" id="sidebar">
      <nav class="sidebar__nav">
        <div class="sidebar__section">Principal</div>
        <a href="#/dashboard" class="sidebar__link ${path === '/dashboard' ? 'sidebar__link--active' : ''}">
          <span class="material-icons">dashboard</span>
          Dashboard
        </a>
        <a href="#/eventos" class="sidebar__link ${path === '/eventos' ? 'sidebar__link--active' : ''}">
          <span class="material-icons">event</span>
          Eventos
        </a>
        <div class="sidebar__section">Rovers</div>
        <a href="#/rover/new" class="sidebar__link ${path === '/rover/new' ? 'sidebar__link--active' : ''}">
          <span class="material-icons">person_add</span>
          Agregar Rover
        </a>
      </nav>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `;
}

export function bindSidebar() {
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('sidebar--open');
      overlay.classList.remove('sidebar-overlay--visible');
    });
  }
}
