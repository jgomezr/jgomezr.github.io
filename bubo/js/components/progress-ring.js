// Indicador circular de progreso (SVG)

export function renderProgressRing(percent, size = 60, strokeWidth = 6) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  let color = 'var(--color-warning)';
  if (percent >= 100) color = 'var(--color-success)';
  else if (percent >= 60) color = 'var(--color-primary)';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="progress-ring">
      <circle
        cx="${center}" cy="${center}" r="${radius}"
        fill="none"
        stroke="var(--color-border)"
        stroke-width="${strokeWidth}"
      />
      <circle
        cx="${center}" cy="${center}" r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        stroke-linecap="round"
        transform="rotate(-90 ${center} ${center})"
        style="transition: stroke-dashoffset 0.5s ease"
      />
      <text
        x="${center}" y="${center}"
        text-anchor="middle"
        dominant-baseline="central"
        font-size="${size * 0.22}"
        font-weight="600"
        fill="var(--color-text)"
      >${percent}%</text>
    </svg>
  `;
}
