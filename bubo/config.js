// ============================================
// CONFIGURACIÓN - Editar estos valores
// ============================================

export const CONFIG = {
  // ID del spreadsheet (está en la URL del sheet entre /d/ y /edit)
  // Ejemplo: https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
  SPREADSHEET_ID: '1mLEne4CbdTH86IIYnqHJWOLdlPARQN1JPrWreNbv9pI',

  // URL del Apps Script desplegado (para escritura)
  // Ver apps-script-code.js para instrucciones de despliegue
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzGjx0-jlFZGVKYbMpeSc-40vRwvK_MbIfKVM9VR-s8RTDTYZIBQ7J9KhMfhY0zNkKc/exec',

  // Nombre de la hoja (pestaña) en el spreadsheet
  SHEET_NAME: 'PA',

  // Fila donde empiezan los datos (1-based)
  DATA_START_ROW: 4,

  // Credenciales del líder
  LEADER_USER: 'jefe',
  LEADER_PASS: 'scout2024',

  // Cache TTL en milisegundos (5 minutos)
  CACHE_TTL: 5 * 60 * 1000,
};
