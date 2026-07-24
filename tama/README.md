# 🐹 TamaBoy

**TamaBoy** es una mascota virtual estilo Tamagotchi que vive dentro de una consola retro en tu navegador. Elige un huevo, cuida a tu mascota todos los días, juega con ella y ayúdala a crecer hasta convertirse en adulta. Pero cuidado: su vida sigue transcurriendo aunque cierres la app — si la abandonas, se enfermará… y puede irse para siempre.

Es una **PWA** hecha solo con HTML, CSS y JavaScript: sin frameworks, sin servidor y 100% offline. Se instala en Android como una app más.

## 🥚 Elige tu mascota

Al empezar hay tres huevos esperando. Cada especie tiene su propia comida favorita y su propia personalidad visual:

| Especie | Comida favorita |
|---------|-----------------|
| 🐹 **Capibara** | Maíz |
| 🐆 **Puma** | Carne |
| 🦅 **Cóndor** | Frutos |

El huevo eclosiona a los 5 minutos. A partir de ahí, tu mascota depende de ti.

## ❤️ Cuidados

Tu mascota tiene 4 necesidades que bajan con el paso del tiempo **real** (¡incluso con la app cerrada!):

- **🌽 Comida** — aliméntala desde el menú antes de que pase hambre.
- **⚡ Energía** — se gasta durante el día; duerme sola de 10pm a 7am, o apágale la luz tú mismo.
- **🧼 Higiene** — se ensucia con el tiempo… y deja sorpresas en el suelo que hay que limpiar.
- **😊 Ánimo** — baja si no juegas con ella. Los mini-juegos son la forma de subirlo.

Cuando una necesidad está baja, aparece un icono parpadeando en la pantalla. Si dejas alguna en cero demasiado tiempo, tu mascota **se enfermará** (dale medicina pronto). Una enfermedad sin tratar por un día entero es el fin: tu mascota se irá, y tendrás que empezar con un nuevo huevo de la siguiente generación.

Al abrir la app después de un tiempo, el juego calcula todo lo que pasó mientras no estabas: lo que durmió, lo que ensució, el hambre que acumuló. No hay pausa — es una mascota de verdad.

## 🌱 Ciclo de vida

```
🥚 Huevo (5 min) → 👶 Bebé (1 día) → 🧒 Niño (3 días) → 🎓 Adulto
```

La forma adulta depende de **cómo la cuidaste**: un promedio alto de cuidados produce la forma buena; el descuido produce la forma traviesa. Cada especie tiene sus dos formas — ¿podrás verlas todas?

## 🎮 Mini-juegos

Desde el menú (`START → JUGAR`). Los puntos se convierten en ánimo para tu mascota, y la dificultad crece con su etapa de vida:

### 🏃 Carrera
Un runner de plataformas: tu mascota corre sola por un mundo con huecos, tuberías y enemigos. Salta con **A** (mantén presionado para saltar más alto), aplasta enemigos cayéndoles encima, agáchate con **⬇** para esquivar abejas, y recoge su comida favorita hasta llegar a la meta.

### 🎯 Puntería
Globos y dianas cruzan el cielo: **toca la pantalla** para dispararles. Tienes 3 tiros por ronda y 8 rondas; cada ronda es más rápida. Tu mascota celebra tus aciertos desde abajo (y se burla un poco de tus fallos).

### 🏂 Descenso
Un esquiador baja una montaña nevada infinita. Salta con **A**, y mantén **A** en el aire para dar un giro — aterrízalo bien y ganarás puntos y velocidad; aterriza de cabeza y se acabó. Esquiva las rocas. Con el cóndor, la partida se llama *Planeo* y la gravedad es más suave.

## 🕹️ Controles

| Control | Función |
|---------|---------|
| Cruceta | Navegar menús · moverse/agacharse en mini-juegos |
| **A** (rojo) | Confirmar · saltar · acariciar a la mascota |
| **B** (amarillo) | Cancelar / volver |
| **START** | Abrir el menú de cuidados · salir de un mini-juego |
| **SELECT** | Ver el estado (barras, edad, generación) |
| Tocar la pantalla | Disparar (solo en Puntería) |

En escritorio: flechas, `X` o `Espacio` = A, `Z` = B, `Enter` = Start, `Shift` = Select.

## 📱 Cómo jugarlo

**En tu PC:**

```bash
# en la carpeta del proyecto (necesita servirse por HTTP)
python3 -m http.server 8317
# → abrir http://localhost:8317
```

**En tu Android (instalado como app):**

1. Publica la carpeta en un hosting HTTPS — GitHub Pages gratis es suficiente: *Settings → Pages → Deploy from a branch*.
2. Abre la URL en Chrome del teléfono.
3. Menú ⋮ → **"Añadir a pantalla de inicio"**.

Queda instalado con su icono, pantalla completa y funciona sin conexión. Al publicar cambios, sube la versión del caché en `sw.js` (`tamaboy-v5` → `v6`) para que las instalaciones se actualicen.

## 🛠️ Para curiosos

**Trucos de desarrollo:**

- `?speed=60` — el tiempo simulado corre ×60 (el huevo eclosiona en 5 segundos, un día pasa en 24 minutos).
- `?reset=1` — borra la partida y empieza de cero.
- En la consola del navegador, `window.tama` expone el estado y las acciones del juego.

**Estructura del código:**

```
index.html         carcasa de la consola (DOM) + canvas 160×272 (vertical)
css/style.css      estética de la carcasa (púrpura translúcido)
js/main.js         loop principal, entrada, catch-up, registro del SW
js/state.js        estado + guardado en localStorage
js/engine.js       simulación: decaimiento, sueño, cacas, enfermedad, evolución
js/pet.js          especies, duraciones, pixel art y paletas de color
js/render.js       sprites con paleta por sprite, fuente pixel 3×5, primitivas
js/ui.js           pantallas: hogar, menús, stats, evolución, muerte
js/minigame.js     utilidades compartidas de los mini-juegos
js/runner.js       Carrera (plataformas)
js/shooter.js      Puntería (estilo Duck Hunt)
js/descent.js      Descenso/Planeo (estilo Alto's Adventure)
sw.js              service worker cache-first (modo offline)
manifest.json      manifiesto PWA
assets/icons/      iconos de la app
```

Todo el arte del juego son sprites de texto: mapas de caracteres definidos en `js/pet.js` que el renderizador pinta píxel a píxel con la paleta de cada especie. No hay ni una sola imagen en el juego (salvo los iconos de la app).

---

Hecho con cariño para cuidar capibaras, pumas y cóndores. 🐹🐆🦅
