# Notas — PWA personal estilo Obsidian

App de notas en markdown en un solo `index.html`: sin framework, sin build, sin backend y sin login. Enlaces bidireccionales, tabs por tag, vista de grafo y sincronización con un repo privado de GitHub. Regla del proyecto: **simplicidad y utilidad ante todo**.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa (generado — **no editar a mano**) |
| `sw.js` | Service worker: la app instalada arranca offline |
| `manifest.json` + `icon-192.png` + `icon-512.png` | Necesarios para que Android la instale como app real (WebAPK) |
| `src/` | Fuentes editables y `build.sh` que regenera `index.html` |

**Despliegue** = subir los 5 primeros a un repo público con GitHub Pages. Las notas nunca están ahí: viven en otro repo **privado**.

## Uso

- `Ctrl+N` nueva nota · `Ctrl+E` edición/lectura · `Ctrl+K` paleta de comandos · `Ctrl+G` grafo · `Ctrl+S` guardar y sincronizar
- **Enlaces**: escribe `[[` y autocompleta. Los backlinks aparecen en el panel inferior. En modo lectura, los enlaces rotos se ven en rojo y crear la nota pide confirmación. Renombrar una nota reescribe automáticamente los `[[enlaces]]` que apuntan a ella.
- **Tags y tabs**: añade `#tags` en el texto; en ⚙ Ajustes crea tabs (nombre, emoji, color) que filtran por tag. Se reordenan arrastrando y pueden ir arriba o en riel lateral. Se sincronizan cifrados.
- **Plantillas**: cualquier nota con `#plantilla` aparece en `Ctrl+K` → "Nueva desde plantilla". Placeholders: `{{title}}`, `{{date}}`, `{{time}}`.
- **Grafo**: rueda para zoom, arrastrar nodos o fondo, clic abre la nota. Colorea según el tab activo y respeta su filtro.

## Sincronización (una vez por dispositivo)

1. Crea un repo **privado** en GitHub (solo para notas) y un *fine-grained token*: acceso únicamente a ese repo, permiso **Contents: Read and write** (Metadata se activa solo). Ningún otro permiso.
2. En ⚙ Ajustes: pega `usuario/repo` y el token → "Probar conexión" (debe decir *privado*) → Guardar.
3. **Segundo dispositivo**: misma URL de la app y, en Ajustes, mismo repo + token. Al sincronizar baja todo; las notas de bienvenida locales se retiran solas.

Estados en la barra inferior del panel: `✓` sincronizado · `●` cambios pendientes (sube solo a los 15 s) · `⚠` error (el texto dice la causa; clic actúa en consecuencia).

Las notas viven en el repo como `notes/<uuid>.json` en texto claro: puedes leerlas (y hasta editarlas con cuidado) desde GitHub web.

## Seguridad

- **Sin cifrado**: las notas suben en claro; la privacidad la da el repo privado y el token con permisos mínimos. El token se guarda sin cifrar en el navegador — no uses la app en un dispositivo compartido.
- **Migración desde la versión cifrada**: al abrir la app tras actualizar, pide tu antigua frase **una única vez** para descifrar el token y las notas del repo. En el siguiente sync todo se re-sube en claro y los archivos `.enc` y `meta.json` se borran del repo. Consejo: sincroniza y actualiza (abre online) todos tus dispositivos antes, y hazlo primero en el que esté más al día.
- Si no recuerdas la frase: pulsa "Ahora no" y pega el token de nuevo en Ajustes; tus notas locales están en claro y se re-suben igualmente (solo se perdería lo que estuviera únicamente cifrado en el repo).

## Conflictos

Si una nota cambió en dos dispositivos sin sincronizar en medio, se conservan las dos: la remota queda como `Título (conflicto fecha)` y resuelves a mano. Nunca se pierde contenido. Copias idénticas no cuentan como conflicto.

## Instalación

- **Android**: abre la URL de Pages en Chrome → ⋮ → "Instalar aplicación". Aparece en el cajón de apps con su icono. Para cerrar el panel lateral, toca fuera de él.
- **Uso sin conexión**: requiere `sw.js` subido junto a `index.html` y abrir la app **una vez con internet** después de desplegarlo (ahí se guarda la copia offline). En ⚙ Ajustes → "Sin conexión" se ve si la copia está lista.
- **Escritorio**: icono de instalar en la barra de direcciones, o sin hospedar: acceso directo a `msedge --app="file:///...index.html"`.
- El archivo local con doble clic funciona siempre (sin instalación).

## Desarrollo

1. Edita `src/part1.html` (HTML/CSS) o `src/part2.html` (todo el JS). Nunca `index.html`.
2. `bash src/build.sh` regenera `index.html`.
3. Si cambias `sw.js`, sube el nombre de caché (`notas-v3` → `notas-v4`).
4. Actualizar la app desplegada = subir el nuevo `index.html` a Pages; entra en la **segunda** apertura.

## Errores de sync frecuentes

| Mensaje | Causa y remedio |
|---|---|
| `GitHub 401` | Token caducado o mal pegado → genera/pega uno nuevo |
| `GitHub 404` | Repo o rama mal escritos en Ajustes |
| `🔑 Migración pendiente` | El token sigue cifrado por la versión anterior → clic y escribe la frase antigua (o pega el token de nuevo en Ajustes) |
| `Notas cifradas por la versión anterior…` | Quedan `.enc` en el repo → clic y escribe la frase antigua para migrarlas |
| `Sin conexión` | Se reintenta solo al volver la red |

## Limitaciones conocidas

- Dos notas con el mismo título hacen ambiguos los `[[enlaces]]` por título.
- El buscador recorre todo el texto en vivo (sobra hasta miles de notas; sin índice).
- Notas muy grandes (>100 KB) pueden ralentizar el resaltado del editor.
- Los archivos del repo se llaman por UUID, no por título: legibles desde GitHub web, pero no es un vault de Obsidian.
