// Renderizador: canvas lógico 160x144, ahora a color.
// Los "shades" 0..3 siguen funcionando como rampa neutra para UI
// (0=fondo crema ... 3=tinta oscura); también se aceptan colores CSS.
// Los sprites usan chars 1/2/3 que se pintan con la paleta del sprite
// (map.pal) o una paleta pasada por opts.palette.

export const W = 160;
export const H = 272;
export const PALETTE = ['#f6f1e4', '#cfc6b4', '#8a8272', '#3a3226'];

let ctx = null;

export function initRender(canvas) {
  canvas.width = W;
  canvas.height = H;
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
}

export function raw() { return ctx; }

function color(c) {
  return typeof c === 'number' ? PALETTE[c] : c;
}

export function clear(c = 0) {
  ctx.fillStyle = color(c);
  ctx.fillRect(0, 0, W, H);
}

export function rect(x, y, w, h, c = 3) {
  ctx.fillStyle = color(c);
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function px(x, y, c = 3) {
  rect(x, y, 1, 1, c);
}

export function frame(x, y, w, h, c = 3) {
  rect(x, y, w, 1, c);
  rect(x, y + h - 1, w, 1, c);
  rect(x, y, 1, h, c);
  rect(x + w - 1, y, 1, h, c);
}

// Caja de diálogo: fondo claro + doble borde
export function box(x, y, w, h) {
  rect(x, y, w, h, 0);
  frame(x, y, w, h, 3);
  frame(x + 1, y + 1, w - 2, h - 2, 0);
  frame(x + 2, y + 2, w - 4, h - 4, 2);
}

const DEFAULT_SPRITE_PAL = [PALETTE[3], PALETTE[2], PALETTE[1]]; // 1=oscuro 2=medio 3=claro

function palFor(map, opts) {
  return opts.palette || map.pal || DEFAULT_SPRITE_PAL;
}

export function sprite(map, x, y, opts = {}) {
  const { scale = 1, flipX = false } = opts;
  const pal = palFor(map, opts);
  for (let r = 0; r < map.length; r++) {
    const line = map[r];
    // bordes redondeados por celda para que las escalas no enteras no dejen huecos
    const y0 = Math.round(y + r * scale), y1 = Math.round(y + (r + 1) * scale);
    for (let c = 0; c < line.length; c++) {
      const ch = line[flipX ? line.length - 1 - c : c];
      if (ch === '.') continue;
      const col = pal[ch - 1];
      if (!col) continue;
      const x0 = Math.round(x + c * scale), x1 = Math.round(x + (c + 1) * scale);
      ctx.fillStyle = col;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
}

// Sprite rotado alrededor de su centro (para el mini-juego de descenso)
export function spriteRot(map, cx, cy, angle, opts = {}) {
  const { scale = 1 } = opts;
  const pal = palFor(map, opts);
  const size = map.length * scale;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  ctx.rotate(angle);
  ctx.translate(-size / 2, -size / 2);
  for (let r = 0; r < map.length; r++) {
    const line = map[r];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '.') continue;
      const col = pal[ch - 1];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  }
  ctx.restore();
}

// ---- fuente 3x5 ----
const FONT = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6],
  E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5],
  I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 6, 4, 6, 5], L: [4, 4, 4, 4, 7],
  M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4],
  Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2],
  U: [5, 5, 5, 5, 7], V: [5, 5, 5, 2, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
  Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  '0': [7, 5, 5, 5, 7], '1': [2, 6, 2, 2, 7], '2': [6, 1, 2, 4, 7], '3': [7, 1, 3, 1, 7],
  '4': [5, 5, 7, 1, 1], '5': [7, 4, 6, 1, 6], '6': [3, 4, 7, 5, 7], '7': [7, 1, 2, 2, 2],
  '8': [7, 5, 7, 5, 7], '9': [7, 5, 7, 1, 6],
  ' ': [0, 0, 0, 0, 0], '-': [0, 0, 7, 0, 0], ':': [0, 2, 0, 2, 0], '!': [2, 2, 2, 0, 2],
  '?': [6, 1, 2, 0, 2], '.': [0, 0, 0, 0, 2], '/': [1, 1, 2, 4, 4], '+': [0, 2, 7, 2, 0],
  '%': [5, 1, 2, 4, 5], '<': [1, 2, 4, 2, 1], '>': [4, 2, 1, 2, 4], '@': [5, 7, 7, 2, 0],
  'Ñ': [7, 0, 6, 5, 5], "'": [2, 2, 0, 0, 0], ',': [0, 0, 0, 2, 4], '(': [1, 2, 2, 2, 1],
  ')': [4, 2, 2, 2, 4], '=': [0, 7, 0, 7, 0], '*': [0, 5, 2, 5, 0],
};

export function text(str, x, y, c = 3, scale = 1) {
  str = String(str).toUpperCase();
  let cx = x;
  for (const ch of str) {
    const glyph = FONT[ch] || FONT['?'];
    for (let r = 0; r < 5; r++) {
      const bits = glyph[r];
      for (let cc = 0; cc < 3; cc++) {
        if (bits & (4 >> cc)) rect(cx + cc * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 4 * scale;
  }
  return cx;
}

export function textWidth(str, scale = 1) {
  return String(str).length * 4 * scale - scale;
}

export function textC(str, y, c = 3, scale = 1) {
  text(str, Math.round((W - textWidth(str, scale)) / 2), y, c, scale);
}

// Barra horizontal para stats
export function bar(x, y, w, h, ratio, c = 3) {
  frame(x, y, w, h, c);
  const fill = Math.round((w - 2) * Math.max(0, Math.min(1, ratio)));
  if (fill > 0) {
    const col = ratio < 0.25 ? '#c43a2e' : ratio < 0.5 ? '#d89a2a' : '#4e9a3a';
    rect(x + 1, y + 1, fill, h - 2, col);
  }
}

// Atenuar pantalla (noche / pausa)
export function dim() {
  ctx.fillStyle = 'rgba(24, 18, 52, 0.5)';
  ctx.fillRect(0, 0, W, H);
}
