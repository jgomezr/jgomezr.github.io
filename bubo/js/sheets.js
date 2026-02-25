// Lectura y escritura vía Apps Script (único punto de conexión)

import { CONFIG } from '../config.js';
import { getState, setState } from './state.js';
import { parseRow } from './models/rover.js';

// --- Comunicación con Apps Script ---

async function appsScriptGet(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query
    ? `${CONFIG.APPS_SCRIPT_URL}?${query}`
    : CONFIG.APPS_SCRIPT_URL;

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error('Error al leer datos del servidor');
  return res.json();
}

async function appsScriptPost(payload) {
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    redirect: 'follow',
  });

  if (!res.ok) {
    // Apps Script redirige; si el redirect falla, lanzar error
    throw new Error(`Error ${res.status} al escribir datos`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    // Si no podemos leer JSON (posible respuesta opaca), asumir éxito
    return { status: 'ok' };
  }

  if (data.status === 'error') {
    throw new Error(data.message || 'Error en Apps Script');
  }
  return data;
}

// --- Funciones públicas ---

export async function fetchAllRovers(forceRefresh = false) {
  const { rovers, lastFetch } = getState();

  if (!forceRefresh && rovers.length > 0 && (Date.now() - lastFetch) < CONFIG.CACHE_TTL) {
    return rovers;
  }

  setState({ loading: true });

  try {
    const data = await appsScriptGet({ action: 'readAll' });
    const rows = data.rows || [];

    const parsed = rows
      .map((row, i) => parseRow(row.values, row.rowNumber))
      .filter(r => r.id || r.nombre);

    setState({ rovers: parsed, lastFetch: Date.now(), loading: false });
    return parsed;
  } catch (err) {
    setState({ loading: false });
    throw err;
  }
}

export async function updateCell(row, col, value) {
  await appsScriptPost({ action: 'updateCell', row, col, value });

  // Actualización optimista en cache
  const { rovers } = getState();
  const updated = rovers.map(r => {
    if (r.row === row) {
      const newRaw = [...r._raw];
      newRaw[col - 1] = value;
      return parseRow(newRaw, row);
    }
    return r;
  });
  setState({ rovers: updated });
}

export async function addRover(values) {
  await appsScriptPost({ action: 'addRow', values });
  await fetchAllRovers(true);
}

export async function updateRoverRow(row, values) {
  await appsScriptPost({ action: 'updateRow', row, values });
  const { rovers } = getState();
  const updated = rovers.map(r =>
    r.row === row ? parseRow(values, row) : r
  );
  setState({ rovers: updated });
}

export async function deleteRover(row) {
  await appsScriptPost({ action: 'clearRow', row });
  const { rovers } = getState();
  setState({ rovers: rovers.filter(r => r.row !== row) });
}
