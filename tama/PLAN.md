# Tama — Plan del juego

Mascota virtual estilo Tamagotchi como PWA para Android. Solo HTML + CSS + JavaScript vanilla, sin frameworks ni backend. 100% offline.

## Decisiones de diseño

- **Estilo visual:** pixel art retro, pantalla tipo LCD del Tamagotchi clásico.
- **Mecánicas:** stats básicas (hambre, sueño, higiene, felicidad), evolución por etapas y mini-juegos.
- **Sin notificaciones:** al abrir la app se calcula el tiempo transcurrido y se actualiza el estado ("catch-up"). Cero permisos, cero servidor.
- **Persistencia:** `localStorage` con versión de esquema para poder migrar saves en el futuro.

## Concepto

El jugador elige uno de tres huevos: **capibara**, **puma** o **cóndor**. Debe alimentarlo, hacerlo dormir, limpiarlo y jugar con él. Las stats bajan con el tiempo real (incluso con la app cerrada). Según la calidad del cuidado, la mascota evoluciona a formas distintas dentro de su especie. Si se descuida mucho, se enferma; el descuido prolongado reinicia el ciclo con un huevo nuevo (y se puede probar otra especie).

## Stats y simulación de tiempo

Cuatro stats de 0 a 100:

| Stat       | Baja                          | Se recupera con        |
|------------|-------------------------------|------------------------|
| Hambre     | ~4 pts/hora                   | Alimentar              |
| Energía    | ~3 pts/hora (despierto)       | Dormir (sube dormido)  |
| Higiene    | ~2 pts/hora (+ caca aleatoria)| Limpiar                |
| Felicidad  | ~3 pts/hora                   | Mini-juegos, jugar     |

**Motor de tiempo (la pieza clave del juego):**

- Se guarda `lastTick` (timestamp) en cada actualización de estado.
- Un `tick()` corre cada ~30 s con la app abierta.
- Al abrir la app: `elapsed = Date.now() - lastTick` y se simula todo lo ocurrido en ese lapso (decaimiento de stats, sueño automático en horario nocturno, cacas, enfermedad, progreso de evolución). Así la mascota "vivió" mientras la app estaba cerrada.
- Tope de simulación (p. ej. 48 h) para que un abandono largo no haga cálculos absurdos: pasa directo a "enferma" o "se fue".
- Protección contra relojes que van hacia atrás (elapsed negativo ⇒ 0).

## Evolución y etapas de vida

```
Huevo (5 min) → Bebé (24 h) → Niño (3 días) → Adulto (permanente)
```

- La especie (capibara, puma o cóndor) se elige al inicio y no cambia; la evolución ramifica **dentro** de la especie.
- Cada transición evalúa el **puntaje de cuidado** (promedio histórico de stats + número de descuidos).
- Buen cuidado ⇒ forma "buena"; cuidado pobre ⇒ forma "traviesa/descuidada". Con 2 ramas por especie basta para el MVP (6 adultos posibles: 2 por especie).
- Estados especiales: durmiendo, enfermo (aparece si alguna stat pasa mucho tiempo en 0; se cura con "medicina"), muerte/partida ⇒ nuevo huevo.

## Mini-juegos (suben felicidad)

Los tres corren en el mismo canvas de la pantalla LCD, con tiles pixel art de la misma paleta. Los puntos obtenidos se convierten en felicidad al terminar. Dificultad progresiva con la etapa de la mascota: de bebé más lento y fácil; de adulto, más rápido y exigente. **Coleccionables según la especie:** maíz para el capibara, carne para el puma, y carroña/frutos para el cóndor.

### 1. Runner de plataformas (estilo Super Mario)

- La mascota **corre automáticamente** por un nivel lateral con scroll; el jugador salta con **A** y se agacha con **abajo en la cruceta** (Start pausa/sale).
- Elementos del nivel: plataformas a distintas alturas, huecos, tuberías/troncos como obstáculos y enemigos simples que patrullan (se esquivan o se aplastan saltando encima).
- Niveles cortos (45–60 s) generados combinando **tramos prediseñados** en orden semi-aleatorio, para que cada partida sea distinta sin tener que diseñar niveles a mano.
- Física simple en canvas: gravedad, salto con impulso variable (salto más alto si mantienes presionado), colisión AABB contra una grilla de tiles.

### 2. Puntería (estilo Duck Hunt)

- Objetivos vuelan cruzando la pantalla en trayectorias variadas (globos, dianas, frutas lanzadas — **no aves**, que aquí son mascotas 🙂). El jugador **toca directamente la pantalla LCD** para disparar; es el único mini-juego con control táctil sobre la pantalla (la cruceta + A queda como alternativa para mover la retícula y disparar).
- Retícula visible, munición limitada por ronda (p. ej. 3 tiros por tanda de 2 objetivos, como el original) y rondas progresivamente más rápidas.
- La mascota aparece abajo celebrando los aciertos o burlándose de los fallos, como el perro de Duck Hunt.
- Técnicamente el más simple de los tres: detección de toque contra la posición del objetivo, sin física ni colisiones de mapa.

### 3. Descenso (estilo Alto's Adventure)

- La mascota **se desliza cuesta abajo** por un terreno ondulado infinito con scroll lateral (el cóndor planea en corrientes de aire con la misma mecánica).
- Un solo control: **A** — toque corto salta, mantener presionado en el aire hace un **giro**; aterrizar el giro da bonus de puntos y un impulso de velocidad. Aterrizar de cabeza termina la partida.
- Terreno generado como una curva de colinas suaves encadenadas (sin grilla de tiles: la altura del suelo es una función continua), con rocas y huecos como obstáculos.
- Estética de siluetas con paleta LCD: montañas en capas con parallax para dar profundidad.

## Interfaz (estética Game Boy)

- **Carcasa estilo Game Boy clásico** dibujada con CSS: cuerpo gris rectangular con esquina inferior derecha redondeada, marco oscuro alrededor de la pantalla con el texto "DOT MATRIX", LED de "batería", rejilla de altavoz con líneas diagonales abajo a la derecha. En portrait ocupa toda la pantalla del teléfono.
- **Pantalla:** un `<canvas>` de **160×144 lógicos** (la resolución real del Game Boy, 10:9) escalado con `image-rendering: pixelated`, con la **paleta original de 4 tonos verde-oliva**.
- **Controles en disposición Game Boy**, todos táctiles y aptos para pulgar:
  - **Cruceta** (izquierda): navegar el menú de cuidados; en los mini-juegos, moverse/agacharse.
  - **A** (derecha): confirmar / saltar. **B**: cancelar / acción secundaria.
  - **Start:** abrir y cerrar el menú de cuidados. **Select:** pantalla de estado/estadísticas.
- El menú de cuidados (comida, luz/dormir, juego, limpieza, medicina, estado) se dibuja **dentro** de la pantalla como una fila de iconos pixel art, navegable con la cruceta — como un juego de Game Boy real.
- Sprites: sprite sheet PNG por especie y etapa (idle 2 frames, comer, dormir, feliz, triste, enfermo, y correr/saltar para los mini-juegos). Animación por alternancia de frames a ~2 fps para el look retro (los mini-juegos corren a más fps). La resolución 160×144 da espacio para sprites de mascota de 32×32.
- Viewport móvil: `user-scalable=no`, safe areas, todo dimensionado con unidades relativas.
- Excepción de control: el mini-juego de puntería se juega tocando la pantalla LCD directamente (la cruceta queda como alternativa para mover la retícula).

## PWA

- **`manifest.json`:** nombre, iconos (192 y 512 px, versión maskable), `display: standalone`, `orientation: portrait`, colores de tema.
- **Service worker:** estrategia *cache-first* con precache de todos los assets en el `install` (app shell completo). Versión de caché para invalidar al actualizar.
- Instalable desde Chrome Android ("Añadir a pantalla de inicio").
- Requisito: servir por HTTPS (GitHub Pages sirve gratis y es suficiente).

## Estructura de archivos

```
Tama/
├── index.html
├── manifest.json
├── sw.js                  # service worker
├── css/
│   └── style.css          # carcasa, botones, layout
├── js/
│   ├── main.js            # bootstrap, loop principal, registro del SW
│   ├── state.js           # estado del juego + load/save en localStorage
│   ├── engine.js          # tick(), catch-up, decaimiento, evolución
│   ├── pet.js             # definición de etapas, formas, umbrales
│   ├── render.js          # canvas, sprites, animaciones
│   ├── ui.js              # menú, botones A/B/C, navegación
│   ├── minigame.js        # base común: loop, puntaje, entrada, fin de partida
│   ├── runner.js          # runner: física de tiles, tramos, enemigos
│   ├── shooter.js         # puntería: objetivos, retícula, rondas
│   └── descent.js         # descenso: terreno ondulado, saltos y giros
└── assets/
    ├── sprites/           # sprite sheets por especie y etapa + tiles de los mini-juegos
    └── icons/             # iconos PWA
```

Módulos ES (`type="module"`), sin bundler.

## Modelo de datos (localStorage)

```js
{
  version: 1,
  species: "capybara",   // capybara | puma | condor
  createdAt: 0,          // nacimiento del huevo actual
  lastTick: 0,
  stage: "egg",          // egg | baby | child | adult
  form: "base",          // rama de evolución
  stats: { hunger: 100, energy: 100, hygiene: 100, happiness: 100 },
  careScore: 100,        // promedio móvil del cuidado
  neglectCount: 0,
  flags: { sleeping: false, sick: false, poops: 0 },
  generation: 1          // cuántas mascotas ha habido
}
```

## Fases de desarrollo

**Fase 1 — Núcleo jugable (MVP)**
1. Esqueleto HTML/CSS: carcasa, pantalla canvas, 3 botones.
2. `state.js` + `engine.js`: stats, tick, catch-up con timestamps, save/load.
3. Sprite provisional (un cuadrado animado) y acciones: alimentar, dormir, limpiar.
4. Probar en Chrome Android por IP local.

**Fase 2 — PWA**
5. `manifest.json` + iconos + service worker cache-first.
6. Deploy a GitHub Pages y prueba de instalación en Android.

**Fase 3 — Vida de la mascota**
7. Sprites pixel art de capibara, puma y cóndor por etapa, selección de huevo y sistema de animación.
8. Evolución con ramas por puntaje de cuidado; enfermedad y muerte/reinicio.

**Fase 4 — Mini-juegos** (en orden de complejidad; el juego ya es completo sin ellos)
9. Base común (`minigame.js`): loop, puntaje, conversión a felicidad, entrada, pantalla de fin.
10. **Puntería** (el más simple): objetivos, retícula táctil, rondas.
11. **Runner:** física (gravedad, salto, colisiones AABB), scroll lateral, tramos prediseñados, enemigos.
12. **Descenso:** terreno ondulado procedural, física de pendiente, giros y aterrizajes.

**Fase 5 — Pulido**
13. Sonidos retro opcionales (WebAudio), vibración al tocar botones (`navigator.vibrate`), pantalla de estadísticas, export/import del save.

## Riesgos y notas

- **Trampa de reloj:** el jugador puede cambiar la hora del teléfono. Aceptable para un juego casual; mitigar solo el caso de elapsed negativo.
- **Borrado de localStorage:** Android puede limpiar datos de sitios sin uso; al instalarse como PWA el riesgo baja mucho. Ofrecer export/import del save como texto (fase de pulido).
- **Pantalla apagada / pestaña en segundo plano:** los timers de JS se pausan; no importa, porque el catch-up por timestamp cubre cualquier hueco.
