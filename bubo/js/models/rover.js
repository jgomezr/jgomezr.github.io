// Modelo Rover: convierte array de celdas ↔ objeto estructurado

// Nombres de los 16 requisitos de Ruta Inicial (D-S, índices 3-18)
export const RUTA_INICIAL_ITEMS = [
  '6 reuniones de Clan',
  'Ley y Promesa del Rover',
  'Lema del Rover',
  'Divisa del Rover',
  'Oración del Rover',
  'Fines, Principios y Virtudes',
  'Seña y Saludo Scout',
  'Flor de Lis',
  'Sentido del Uniforme',
  'Historia del Escultismo',
  'Roverismo hacia el Éxito',
  'Código del Aire Libre',
  'Documento contra abuso infantil',
  'Nudos y amarres básicos',
  'Normas de campismo',
  'Consejo de Clan',
];

// Áreas de competencia (U-AI, índices 20-34), calificadas de 1-5
export const COMPETENCY_AREAS = [
  {
    key: 'creatividad', label: 'Creatividad', indices: [20, 21, 22],
    subs: ['Innovación', 'Planeación', 'Iniciativa'],
  },
  {
    key: 'caracter', label: 'Carácter y Afectividad', indices: [23, 24, 25],
    subs: ['Ejemplo y Liderazgo', 'Emprendimiento', 'Toma de Decisiones'],
  },
  {
    key: 'sociabilidad', label: 'Sociabilidad', indices: [26, 27, 28],
    subs: ['Servicio', 'Negociación', 'Trabajo en Equipo'],
  },
  {
    key: 'corporalidad', label: 'Corporalidad', indices: [29, 30, 31],
    subs: ['Aire Libre', 'Comunicación', 'Autocontrol'],
  },
  {
    key: 'espiritualidad', label: 'Espiritualidad', indices: [32, 33, 34],
    subs: ['Desarrollo de Principios', 'Sentido de Pertenencia', 'Conciencia Ecológica'],
  },
];

export const MAX_COMP_SCORE = 5;

function isTruthy(val) {
  if (!val) return false;
  const v = String(val).trim().toUpperCase();
  return v === 'TRUE' || v === 'VERDADERO' || v === 'SI' || v === 'SÍ' || v === '1' || v === 'X';
}

function parseScore(val) {
  if (!val) return 0;
  const n = parseInt(String(val).trim(), 10);
  if (isNaN(n) || n < 0) return 0;
  if (n > MAX_COMP_SCORE) return MAX_COMP_SCORE;
  return n;
}

export function parseRow(row, rowNumber) {
  const raw = Array.isArray(row) ? row : [];
  // Asegurar 41 columnas
  while (raw.length < 41) raw.push('');

  const rover = {
    _raw: [...raw],
    row: rowNumber,
    id: (raw[0] || '').toString().trim(),
    nombre: (raw[1] || '').toString().trim(),
    correo: (raw[2] || '').toString().trim(),

    rutaInicial: RUTA_INICIAL_ITEMS.map((name, i) => ({
      name,
      completed: isTruthy(raw[3 + i]),
      colIndex: 3 + i,   // índice en el array (0-based)
      col: 4 + i,        // columna en el sheet (1-based, D=4)
    })),

    uniforme: (raw[19] || '').toString().trim(),

    competencias: {},

    club1: (raw[35] || '').toString().trim(),
    club2: (raw[36] || '').toString().trim(),
    programaAlterno: (raw[37] || '').toString().trim(),

    hitoRS: (raw[38] || '').toString().trim(),
    hitoRL: (raw[39] || '').toString().trim(),
    hitoBP: (raw[40] || '').toString().trim(),
  };

  for (const area of COMPETENCY_AREAS) {
    rover.competencias[area.key] = area.indices.map((idx) => ({
      score: parseScore(raw[idx]),
      colIndex: idx,
      col: idx + 1,
    }));
  }

  return rover;
}

export function roverToRow(rover) {
  const row = new Array(41).fill('');
  row[0] = rover.id;
  row[1] = rover.nombre;
  row[2] = rover.correo;

  // Ruta inicial
  rover.rutaInicial.forEach((item, i) => {
    row[3 + i] = item.completed ? 'TRUE' : 'FALSE';
  });

  row[19] = rover.uniforme;

  // Competencias (valor numérico 0-5)
  for (const area of COMPETENCY_AREAS) {
    area.indices.forEach((idx, subIdx) => {
      const comp = rover.competencias[area.key];
      row[idx] = comp && comp[subIdx] ? comp[subIdx].score : 0;
    });
  }

  row[35] = rover.club1;
  row[36] = rover.club2;
  row[37] = rover.programaAlterno;
  row[38] = rover.hitoRS;
  row[39] = rover.hitoRL;
  row[40] = rover.hitoBP;

  return row;
}

// --- Cálculos de progreso ---

export function getRutaInicialProgress(rover) {
  const done = rover.rutaInicial.filter(i => i.completed).length;
  return { done, total: 16, percent: Math.round((done / 16) * 100) };
}

export function getCompetencyProgress(rover, areaKey) {
  const items = rover.competencias[areaKey] || [];
  const totalScore = items.reduce((sum, i) => sum + i.score, 0);
  const maxScore = items.length * MAX_COMP_SCORE;
  return {
    score: totalScore,
    max: maxScore,
    percent: maxScore ? Math.round((totalScore / maxScore) * 100) : 0,
  };
}

export function getAllCompetenciesProgress(rover) {
  let totalScore = 0;
  let maxScore = 0;
  for (const area of COMPETENCY_AREAS) {
    const items = rover.competencias[area.key] || [];
    totalScore += items.reduce((sum, i) => sum + i.score, 0);
    maxScore += items.length * MAX_COMP_SCORE;
  }
  return {
    score: totalScore,
    max: maxScore,
    percent: maxScore ? Math.round((totalScore / maxScore) * 100) : 0,
  };
}

export function getOverallProgress(rover) {
  const ruta = getRutaInicialProgress(rover);
  const comp = getAllCompetenciesProgress(rover);
  // Promedio ponderado de ambos porcentajes
  const percent = Math.round((ruta.percent + comp.percent) / 2);
  return { percent };
}

export function getCurrentStage(rover) {
  if (rover.hitoBP) return { key: 'bp', label: 'Baden Powell', badge: 'badge--bp' };
  if (rover.hitoRL) return { key: 'rl', label: 'Rover Líder', badge: 'badge--rl' };
  if (rover.hitoRS) return { key: 'rs', label: 'Rover Scout', badge: 'badge--rs' };

  const ruta = getRutaInicialProgress(rover);
  if (ruta.percent === 100) return { key: 'ruta-completa', label: 'Ruta Completa', badge: 'badge--rs' };

  return { key: 'ruta', label: 'En Ruta Inicial', badge: 'badge--ruta' };
}

export function getStageStats(rovers) {
  const stats = { ruta: 0, 'ruta-completa': 0, rs: 0, rl: 0, bp: 0 };
  for (const r of rovers) {
    const stage = getCurrentStage(r);
    stats[stage.key] = (stats[stage.key] || 0) + 1;
  }
  return stats;
}

export function getAverageCompetencies(rovers) {
  if (!rovers.length) return COMPETENCY_AREAS.map(() => 0);

  return COMPETENCY_AREAS.map(area => {
    const total = rovers.reduce((sum, r) => {
      return sum + getCompetencyProgress(r, area.key).percent;
    }, 0);
    return Math.round(total / rovers.length);
  });
}
