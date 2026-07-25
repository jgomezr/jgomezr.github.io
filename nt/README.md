# Notas — PWA personal estilo Obsidian

App de notas en markdown en un solo `index.html`: sin framework, sin build, sin backend y sin login. Enlaces bidireccionales, tabs por tag, vista de grafo, cifrado de extremo a extremo y sincronización con un repo privado de GitHub. Regla del proyecto: **simplicidad y utilidad ante todo**.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa (generado — **no editar a mano**) |
| `sw.js` | Service worker: la app instalada arranca offline |
| `manifest.json` + `icon-192.png` + `icon-512.png` | Necesarios para que Android la instale como app real (WebAPK) |
| `src/` | Fuentes editables y `build.sh` que regenera `index.html` |

**Despliegue** = subir los 5 primeros a un repo público con GitHub Pages. Las notas nunca están ahí: viven cifradas en otro repo privado.

## Uso

- `Ctrl+N` nueva nota · `Ctrl+E` edición/lectura · `Ctrl+K` paleta de comandos · `Ctrl+G` grafo · `Ctrl+S` guardar y sincronizar
- **Enlaces**: escribe `[[` y autocompleta. Los backlinks aparecen en el panel inferior. En modo lectura, los enlaces rotos se ven en rojo y crear la nota pide confirmación. Renombrar una nota reescribe automáticamente los `[[enlaces]]` que apuntan a ella.
- **Tags y tabs**: añade `#tags` en el texto; en ⚙ Ajustes crea tabs (nombre, emoji, color) que filtran por tag. Se reordenan arrastrando y pueden ir arriba o en riel lateral. Se sincronizan cifrados.
- **Plantillas**: cualquier nota con `#plantilla` aparece en `Ctrl+K` → "Nueva desde plantilla". Placeholders: `{{title}}`, `{{date}}`, `{{time}}`.
- **Grafo**: rueda para zoom, arrastrar nodos o fondo, clic abre la nota. Colorea según el tab activo y respeta su filtro.

## Sincronización (una vez por dispositivo)

1. Crea un repo **privado** en GitHub (solo para notas) y un *fine-grained token*: acceso únicamente a ese repo, permiso **Contents: Read and write** (Metadata se activa solo). Ningún otro permiso.
2. En ⚙ Ajustes: establece la **frase de cifrado** → pega `usuario/repo` y el token → "Probar conexión" (debe decir *privado*) → Guardar.
3. **Segundo dispositivo**: misma URL de la app, y en Ajustes la MISMA frase + mismo repo + token. Al sincronizar adopta la configuración del repo y baja todo; las notas de bienvenida locales se retiran solas.

Estados en la barra inferior del panel: `✓` sincronizado · `●` cambios pendientes (sube solo a los 15 s) · `⚠` error (el texto dice la causa; clic actúa en consecuencia).

## Cifrado

- AES-256-GCM con clave derivada de tu frase (PBKDF2, 600k iteraciones). La frase nunca se guarda; el token se guarda cifrado.
- **Todo lo que sube a GitHub va cifrado** (hasta los nombres de archivo son UUIDs). Consecuencia: el repo solo es legible desde esta app. Localmente las notas están en claro (tu dispositivo es tuyo).
- ⚠ **Si olvidas la frase, lo del repo es irrecuperable.** Las notas locales de cada dispositivo siguen legibles.
- **Cambiar la frase**: hazlo en UN dispositivo (re-sube todo re-cifrado) y sincroniza pronto los demás — a cada uno le saldrá un diálogo pidiendo "la frase actual del repositorio"; al escribirla la adoptan. Si el token estaba cifrado con la frase vieja y ese dispositivo no la recuerda, habrá que pegar el token de nuevo.

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
| `La frase cambió en otro dispositivo…` | Clic en el mensaje e introduce la frase actual |
| `No se pudo descifrar una nota…` | La frase no corresponde a este repo |
| `Sin conexión` | Se reintenta solo al volver la red |

## Limitaciones conocidas

- Dos notas con el mismo título hacen ambiguos los `[[enlaces]]` por título.
- El buscador recorre todo el texto en vivo (sobra hasta miles de notas; sin índice).
- Notas muy grandes (>100 KB) pueden ralentizar el resaltado del editor.
- El repo cifrado no es legible desde Obsidian/GitHub web — es el precio del E2E elegido a propósito.
