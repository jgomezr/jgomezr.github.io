# Brasa · Coach personal (PWA)

App de coaching personal 100% local: test ISE, programa de 6 semanas, coach por reglas
(con IA opcional), alter ego, hábitos if-then, bloques de foco y lectura del anillo
R11M/TK5 por Web Bluetooth. Stack: HTML + CSS + JavaScript puro, sin build ni backend.

## Probar en el computador

```bash
cd app
python3 -m http.server 8080
# abrir http://localhost:8080
```

`localhost` cuenta como origen seguro: el service worker y (en Chrome) Web Bluetooth
funcionan sin HTTPS.

## Instalarla en el teléfono (Android + Chrome)

La PWA necesita **HTTPS** en el teléfono. La ruta más simple y gratis: **GitHub Pages**.

1. Crea un repositorio (puede ser privado con Pages… los Pages de repos privados
   requieren plan de pago; si no, crea uno público solo con la carpeta `app/`).
2. Sube el contenido de `app/` a la rama `main`.
3. Settings → Pages → Deploy from branch → `main` / root.
4. Abre `https://<tu-usuario>.github.io/<repo>/` en Chrome del teléfono.
5. Menú ⋮ → **Agregar a pantalla de inicio**. Listo: ícono, pantalla completa, offline.

Alternativas: Netlify Drop (arrastras la carpeta y te da HTTPS), o Cloudflare Pages.

## Anillo (TK5 / R11M)

- Funciona solo en **Chrome de Android** (Safari/iOS no tiene Web Bluetooth).
- La app oficial del anillo **no debe estar conectada** al mismo tiempo — el anillo
  acepta una sola conexión BLE. Ideal: quitarle el permiso de Bluetooth o desinstalarla
  cuando Brasa ya sincronice bien.
- Primera conexión: Más → Anillo → "Conectar y sincronizar". La **Consola BLE** muestra
  todos los servicios y paquetes crudos. El protocolo implementado es el de la familia
  Colmi/QRing (paquetes de 16 bytes); si tu unidad varía en algún comando (sobre todo
  sueño), los bytes de la consola son la referencia para ajustar `js/ring.js`.
- Mientras el sueño por BLE se verifica, el check-in de mañana acepta horas de sueño y
  FC en reposo a mano (los ves en la app oficial).

## Coach IA (opcional — la app funciona completa sin esto)

- **Sin modelo (por defecto):** motor de reglas + flujos guiados (WOOP, reencuadre,
  cierre) + botón "Copiar contexto → Claude" para conversaciones profundas en la app
  de Claude.
- **Claude API:** Ajustes → Coach IA → pega tu clave (`sk-ant-…`, se guarda solo en el
  dispositivo). Llama a la API directamente desde el navegador (uso personal).
- **Modelo local:** descarga Qwen 0.5B (~350 MB) vía WebLLM y corre en el teléfono con
  WebGPU. Para respuestas cortas y clasificación; la conversación seria es de Claude.

## Datos

Todo vive en IndexedDB del dispositivo. Ajustes → "Exportar JSON" para respaldo;
"Importar JSON" para restaurar (por ejemplo al cambiar de teléfono).

## Estructura

```
app/
  index.html            shell + navegación
  css/styles.css        sistema de diseño (ciruela/brasa/oro)
  js/
    app.js              router, estado, utilidades, pantalla Invocar
    db.js               IndexedDB + export/import
    data-test.js        test ISE (30 preguntas, arquetipos, scoring)
    data-program.js     programa de 6 semanas + hábitos sugeridos
    coach-rules.js      motor de reglas + flujos guiados (WOOP, reencuadre, cierre)
    coach-ai.js         Claude API directa, WebLLM local, exportar contexto
    ring.js             protocolo BLE Colmi/QRing para el TK5
    charts.js           gráficas canvas (líneas, barras, ejes ISE)
    views-*.js          pantallas
  sw.js                 service worker offline-first
  manifest.webmanifest  instalable como app
```
