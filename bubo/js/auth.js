// Autenticación simple: Rover (correo+ID) o Líder (usuario+contraseña)

import { CONFIG } from '../config.js';
import { getState, setState } from './state.js';
import { fetchAllRovers } from './sheets.js';
import { navigate } from './router.js';

const SESSION_KEY = 'pa_session';

export function initAuth() {
  const saved = sessionStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      const user = JSON.parse(saved);
      setState({ user });
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }
}

export async function loginAsRover(correo, id) {
  const correoNorm = correo.trim().toLowerCase();
  const idNorm = id.trim();

  if (!correoNorm || !idNorm) {
    throw new Error('Ingresa tu correo e identificación.');
  }

  // Buscar en el spreadsheet
  const rovers = await fetchAllRovers(true);
  const rover = rovers.find(
    r => r.correo.toLowerCase() === correoNorm && r.id === idNorm
  );

  if (!rover) {
    throw new Error('No se encontró un rover con esos datos. Verifica tu correo e identificación.');
  }

  const user = {
    role: 'rover',
    nombre: rover.nombre,
    correo: rover.correo,
    id: rover.id,
    row: rover.row,
  };

  setState({ user });
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  navigate('/mi-progreso');
}

export function loginAsLeader(username, password) {
  if (username === CONFIG.LEADER_USER && password === CONFIG.LEADER_PASS) {
    const user = {
      role: 'leader',
      nombre: 'Líder',
      correo: '',
      id: '',
      row: null,
    };
    setState({ user });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    navigate('/dashboard');
  } else {
    throw new Error('Usuario o contraseña incorrectos.');
  }
}

export function logout() {
  setState({ user: null, rovers: [] });
  sessionStorage.removeItem(SESSION_KEY);
  navigate('/login');
}

export function getUser() {
  return getState().user;
}
