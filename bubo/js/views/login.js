// Pantalla de login

import { loginAsRover, loginAsLeader } from '../auth.js';
import { showToast } from '../components/toast.js';

export function renderLogin() {
  return `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--color-bg);padding:var(--space-md)">
      <div class="card" style="width:100%;max-width:420px">
        <div class="card__body" style="text-align:center;padding:var(--space-2xl) var(--space-xl)">
          <img src="assets/Bubo_app_logo.png" alt="Logo Bubo" style="width:80px;height:80px;margin:0 auto var(--space-lg);border-radius:var(--radius-md)">
          <h1 style="font-size:var(--font-size-2xl);margin-bottom:var(--space-xs)">Progresión Rover</h1>
          <p style="color:var(--color-text-secondary);margin-bottom:var(--space-xl)">Ingresa para ver tu progreso</p>

          <div class="tabs" id="login-tabs">
            <button class="tabs__tab tabs__tab--active" data-tab="rover">Soy Rover</button>
            <button class="tabs__tab" data-tab="leader">Soy Dirigente</button>
          </div>

          <!-- Formulario Rover -->
          <form id="form-rover" style="text-align:left">
            <div class="form-group">
              <label class="form-label" for="rover-email">Correo electrónico</label>
              <input type="email" id="rover-email" class="form-input" placeholder="tu@correo.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="rover-id">Identificación</label>
              <input type="text" id="rover-id" class="form-input" placeholder="Tu número de ID" required>
            </div>
            <button type="submit" class="btn btn--primary btn--block btn--lg" id="btn-rover-login">
              Ingresar
            </button>
          </form>

          <!-- Formulario Líder -->
          <form id="form-leader" style="display:none;text-align:left">
            <div class="form-group">
              <label class="form-label" for="leader-user">Usuario</label>
              <input type="text" id="leader-user" class="form-input" placeholder="Usuario" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="leader-pass">Contraseña</label>
              <input type="password" id="leader-pass" class="form-input" placeholder="Contraseña" required>
            </div>
            <button type="submit" class="btn btn--primary btn--block btn--lg" id="btn-leader-login">
              Ingresar como Digirente
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function bindLogin() {
  // Tabs
  const tabs = document.querySelectorAll('#login-tabs .tabs__tab');
  const formRover = document.getElementById('form-rover');
  const formLeader = document.getElementById('form-leader');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('tabs__tab--active'));
      tab.classList.add('tabs__tab--active');
      if (tab.dataset.tab === 'rover') {
        formRover.style.display = '';
        formLeader.style.display = 'none';
      } else {
        formRover.style.display = 'none';
        formLeader.style.display = '';
      }
    });
  });

  // Login Rover
  formRover.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-rover-login');
    const correo = document.getElementById('rover-email').value;
    const id = document.getElementById('rover-id').value;

    btn.disabled = true;
    btn.textContent = 'Verificando...';

    try {
      await loginAsRover(correo, id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Ingresar';
    }
  });

  // Login Líder
  formLeader.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('leader-user').value;
    const pass = document.getElementById('leader-pass').value;

    try {
      loginAsLeader(user, pass);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
