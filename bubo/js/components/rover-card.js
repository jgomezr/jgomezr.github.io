// Card resumen de un rover

import { getCurrentStage, getOverallProgress } from '../models/rover.js';
import { renderProgressRing } from './progress-ring.js';

export function renderRoverCard(rover) {
  const stage = getCurrentStage(rover);
  const progress = getOverallProgress(rover);

  return `
    <a href="#/rover/${rover.row}" class="rover-card">
      ${renderProgressRing(progress.percent, 50, 5)}
      <div class="rover-card__info">
        <div class="rover-card__name">${rover.nombre || 'Sin nombre'}</div>
        <div class="rover-card__id">${rover.id}</div>
        <span class="badge ${stage.badge}">${stage.label}</span>
      </div>
    </a>
  `;
}
