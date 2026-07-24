// Anillo R11M/TK5 — familia Yawell/Colmi (app QRing), vía Web Bluetooth.
// Protocolo reverse-engineered (ref: tahnok/colmi_r02_client, Gadgetbridge):
//   servicio estilo Nordic UART, paquetes de 16 bytes [cmd][14 payload][checksum].
// VERIFICAR contra el anillo real en la primera conexión — la consola muestra
// todos los paquetes crudos para ajustar si esta unidad varía.

import { db } from './db.js';
import { todayStr } from './app.js';

// Web Bluetooth solo expone servicios declarados de antemano: pedimos permiso
// para TODOS los candidatos conocidos de esta familia de anillos y luego
// auto-detectamos cuál usa esta unidad.
const UART_SERVICE = '6e40fff0-b5a3-f393-e0a9-e50e24dcca9e'; // Colmi R02+
const NORDIC_UART = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';  // Nordic UART clásico
const BIG_DATA_SERVICE = 'de5bf728-d711-4e47-af26-65e3012a5dc7'; // Colmi big data
const CANDIDATE_SERVICES = [
  UART_SERVICE,
  NORDIC_UART,
  BIG_DATA_SERVICE,
  0xfff0, 0xfee7, 0xfeea, 0xfce7,        // genéricos frecuentes en wearables baratos
  'battery_service', 'heart_rate', 'device_information',
];

export const CMD = {
  SET_TIME: 0x01,
  BATTERY: 0x03,
  BLINK: 0x10,
  HR_LOG: 0x15,          // frecuencia cardiaca histórica
  STEPS: 0x43,           // pasos por día
  SLEEP: 0x44,           // sueño (algunas variantes; otras usan big-data 0xBC)
  HR_REALTIME_START: 0x69,
  HR_REALTIME_STOP: 0x6a,
  BIG_DATA: 0xbc,        // sub-comando 0x27 = sueño en la familia R02
};

export const ring = {
  device: null,
  rx: null,
  connected: false,
  onLog: () => {},
  onPacket: () => {},
};

function log(msg) { ring.onLog(`${new Date().toTimeString().slice(0, 8)} ${msg}`); }

export function makePacket(cmd, payload = []) {
  const p = new Uint8Array(16);
  p[0] = cmd;
  payload.forEach((b, i) => (p[1 + i] = b & 0xff));
  p[15] = p.slice(0, 15).reduce((a, b) => a + b, 0) % 255;
  return p;
}

const hex = (buf) => [...new Uint8Array(buf.buffer || buf)].map((b) => b.toString(16).padStart(2, '0')).join(' ');

export async function connect() {
  if (!navigator.bluetooth) throw new Error('Este navegador no tiene Web Bluetooth. Usa Chrome en Android.');
  ring.device = await navigator.bluetooth.requestDevice({
    // Los anillos de esta familia se anuncian como R01/R02/.../R11/TK5/etc.
    acceptAllDevices: true,
    optionalServices: CANDIDATE_SERVICES,
  });
  log(`Dispositivo: ${ring.device.name || '(sin nombre)'}`);
  ring.device.addEventListener('gattserverdisconnected', () => {
    ring.connected = false;
    log('Desconectado.');
  });

  const server = await ring.device.gatt.connect();
  log('GATT conectado. Enumerando servicios permitidos…');

  // Inventario completo + auto-detección del canal de datos:
  // buscamos un servicio con una característica de ESCRITURA y una de NOTIFY.
  const services = await server.getPrimaryServices();
  if (!services.length) {
    log('El navegador no expone ningún servicio de la lista de candidatos.');
    log('El anillo usa UUIDs que aún no conocemos — hay que capturarlos con la app nRF Connect (gratis en Play Store): conéctate al anillo desde ahí y copia los UUIDs de servicios.');
    throw new Error('Sin servicios visibles: captura los UUIDs con nRF Connect y me los pasas.');
  }

  let best = null; // { writeChar, notifyChar, svcUuid, score }
  ring.stdBattery = null;

  for (const s of services) {
    log(`servicio ${s.uuid}`);
    let chars = [];
    try { chars = await s.getCharacteristics(); } catch { continue; }
    let w = null, n = null;
    for (const c of chars) {
      log(`  característica ${c.uuid} [${props(c)}]`);
      if (c.uuid === '00002a19-0000-1000-8000-00805f9b34fb') ring.stdBattery = c;
      if (!w && (c.properties.write || c.properties.writeWithoutResponse)) w = c;
      if (!n && (c.properties.notify || c.properties.indicate)) n = c;
    }
    if (w && n) {
      // prioridad: UART Colmi conocido > nordic > cualquier otro par write+notify
      const score = s.uuid === UART_SERVICE ? 3 : s.uuid === NORDIC_UART ? 2 : 1;
      if (!best || score > best.score) best = { writeChar: w, notifyChar: n, svcUuid: s.uuid, score };
    }
  }

  if (!best) {
    log('Ningún servicio tiene el par escritura+notificación. Revisa el inventario de arriba.');
    throw new Error('No se encontró canal de datos. Pega la consola BLE en el chat para ajustar el protocolo.');
  }

  ring.rx = best.writeChar;
  await best.notifyChar.startNotifications();
  best.notifyChar.addEventListener('characteristicvaluechanged', (e) => {
    const v = e.target.value; // DataView: respetar byteOffset/byteLength
    const data = new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
    log(`← ${hex(data)}`);
    ring.onPacket(data);
  });
  ring.connected = true;
  log(`Canal de datos: ${best.svcUuid}`);
  log(`  escribir → ${best.writeChar.uuid}`);
  log(`  notificar ← ${best.notifyChar.uuid}`);
}

const props = (c) =>
  ['read', 'write', 'writeWithoutResponse', 'notify', 'indicate'].filter((p) => c.properties[p]).join(',');

export async function send(cmd, payload = []) {
  if (!ring.connected) throw new Error('Anillo no conectado');
  const pkt = makePacket(cmd, payload);
  log(`→ ${hex(pkt)}`);
  await ring.rx.writeValue(pkt);
}

/* Espera el próximo paquete cuyo primer byte === cmd. */
function waitFor(cmd, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const prev = ring.onPacket;
    const timer = setTimeout(() => { ring.onPacket = prev; reject(new Error(`Sin respuesta a 0x${cmd.toString(16)}`)); }, timeoutMs);
    ring.onPacket = (data) => {
      prev(data);
      if (data[0] === cmd) {
        clearTimeout(timer);
        ring.onPacket = prev;
        resolve(data);
      }
    };
  });
}

/* ── operaciones ────────────────────────────────────────────── */

export async function getBattery() {
  try {
    const p = waitFor(CMD.BATTERY, 4000);
    await send(CMD.BATTERY);
    const data = await p;
    return { level: data[1], charging: data[2] === 1 };
  } catch (err) {
    // respaldo: servicio estándar de batería (0x180F/0x2A19) si existe
    if (ring.stdBattery) {
      const v = await ring.stdBattery.readValue();
      const level = v.getUint8(0);
      log(`batería (servicio estándar): ${level}%`);
      return { level, charging: false };
    }
    throw err;
  }
}

export async function setTime() {
  // payload BCD: yy MM dd HH mm ss + idioma (protocolo Colmi)
  const n = new Date();
  const bcd = (v) => ((Math.floor(v / 10) << 4) | (v % 10)) & 0xff;
  await send(CMD.SET_TIME, [
    bcd(n.getFullYear() % 100), bcd(n.getMonth() + 1), bcd(n.getDate()),
    bcd(n.getHours()), bcd(n.getMinutes()), bcd(n.getSeconds()), 1,
  ]);
}

export async function blink() { await send(CMD.BLINK); }

/* Pasos de hoy. Respuesta multi-paquete en la familia R02; aquí tomamos el
   resumen del primer paquete y dejamos los crudos en la consola. */
export async function getStepsToday() {
  const p = waitFor(CMD.STEPS, 8000);
  await send(CMD.STEPS, [0x00, 0x0f, 0x00, 0x5f, 0x01]); // día 0 = hoy (ref colmi_r02_client)
  const d = await p;
  // bytes 9..11: pasos (little endian) en el sub-registro; puede requerir ajuste
  const steps = d[9] | (d[10] << 8) | (d[11] << 16);
  return { steps, raw: [...d] };
}

/* FC en tiempo real: enciende el sensor y reporta el primer valor estable. */
export async function readHeartRateLive(onValue, seconds = 30) {
  const prev = ring.onPacket;
  let best = null;
  ring.onPacket = (d) => {
    prev(d);
    if (d[0] === CMD.HR_REALTIME_START && d[3] > 0) {
      best = d[3];
      onValue?.(d[3]);
    }
  };
  await send(CMD.HR_REALTIME_START, [0x01, 0x00]);
  await new Promise((r) => setTimeout(r, seconds * 1000));
  await send(CMD.HR_REALTIME_STOP, [0x01, 0x00]);
  ring.onPacket = prev;
  return best;
}

/* Sync diario: guarda lo que se pudo leer en ring_data. Sueño queda pendiente
   de verificación de protocolo en esta unidad (big-data 0xBC/0x27). */
export async function syncToday(onStatus) {
  onStatus?.('Ajustando hora…');
  await setTime();

  onStatus?.('Leyendo batería…');
  const bat = await getBattery();

  onStatus?.('Leyendo pasos…');
  let steps = null;
  try { steps = (await getStepsToday()).steps; } catch { onStatus?.('Pasos: sin respuesta (ver consola)'); }

  onStatus?.('Intentando lectura de sueño…');
  let sleepH = null;
  try {
    const p = waitFor(CMD.BIG_DATA, 6000);
    await send(CMD.BIG_DATA, [0x27, 0x01]);
    const d = await p;
    // Formato por verificar en esta unidad; se registra crudo en consola.
    if (d[1] === 0x27 && d[2] > 0) sleepH = null;
  } catch { onStatus?.('Sueño: protocolo por verificar (usa captura manual mientras)'); }

  const rec = {
    date: todayStr(),
    battery: bat.level,
    steps,
    sleepH,
    restingHR: null,
    syncedAt: new Date().toISOString(),
  };
  const prevRec = await db.get('ring', todayStr());
  await db.put('ring', { ...prevRec, ...rec });
  onStatus?.(`Listo. Batería ${bat.level}%${steps != null ? `, ${steps} pasos` : ''}.`);
  return rec;
}

export function disconnect() {
  ring.device?.gatt?.disconnect();
  ring.connected = false;
}
