// Barra de navegación superior

import { getState } from '../state.js';
import { logout } from '../auth.js';

export function renderNavbar() {
  const { user } = getState();

  if (!user) return '';

  const rolLabel = user.role === 'leader' ? 'Líder' : user.nombre;

  return `
    <nav class="navbar">
      <button class="navbar__menu-btn" id="menu-toggle">
        <span class="material-icons">menu</span>
      </button>
      <a href="#/${user.role === 'leader' ? 'dashboard' : 'mi-progreso'}" class="navbar__brand">
        <img src="assets/Bubo_app_logo.png" alt="Logo Bubo">
        <span>Progresión Rover</span>
      </a>
      <div class="navbar__spacer"></div>
      <div class="navbar__actions">
        ${user.role === 'rover' ? '<a href="#/eventos" class="navbar__btn">Eventos</a>' : ''}
        <span class="navbar__user">${rolLabel}</span>
        <button class="navbar__btn" id="btn-logout">Salir</button>
      </div>
    </nav>
  `;
}

export function bindNavbar() {
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  const menuBtn = document.getElementById('menu-toggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      if (sidebar) sidebar.classList.toggle('sidebar--open');
      if (overlay) overlay.classList.toggle('sidebar-overlay--visible');
    });
  }
}
