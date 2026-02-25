// Notificaciones toast

let container = null;

function ensureContainer() {
  if (!container) {
    container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }
  return container;
}

export function showToast(message, type = 'info', duration = 3000) {
  const c = ensureContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `
    <span class="material-icons" style="font-size:18px">
      ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}
    </span>
    <span>${message}</span>
  `;
  c.appendChild(el);

  setTimeout(() => {
    el.classList.add('toast--removing');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}
