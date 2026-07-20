/**
 * kasir-lib — pure, framework-free logic for the Kasir POS.
 *
 * Everything here is a pure function (or a self-contained async I/O helper for
 * Web Bluetooth) ported BYTE-FOR-BYTE from the no-build `kasir.html`. The QRIS
 * EMVCo TLV + CRC16 and the ESC/POS byte building are the auditable core — do
 * not paraphrase the math.
 */
import { formatCurrency } from "../../lib/format.ts";

/** Rp grouping, identical to the source `fmt` helper. */
const fmt = (n: number): string => formatCurrency(n);

// ═══════════════════════════ QRIS ═══════════════════════════
// CRC16-CCITT (False) over UTF-8 bytes — verified against the EMVCo test
// vector (…6304A13A). QRIS uses this exact CRC. Encoding the bytes via
// TextEncoder (NOT charCodeAt) is what makes multibyte payloads hash correctly.
const UTF8 = new TextEncoder();

export function crc16(str: string): string {
  const bytes = UTF8.encode(str);
  let crc = 0xffff;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

interface TLV {
  tag: string;
  value: string;
}

export function parseTLV(s: string): TLV[] {
  const out: TLV[] = [];
  let i = 0;
  while (i + 4 <= s.length) {
    const tag = s.slice(i, i + 2);
    const len = parseInt(s.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len)) break;
    out.push({ tag, value: s.slice(i + 4, i + 4 + len) });
    i += 4 + len;
  }
  return out;
}

export const emv = (tag: string, v: string): string =>
  tag + String(v.length).padStart(2, "0") + v;

// Static merchant QRIS → dynamic with amount. Genuinely payable because it
// derives from the merchant's real static payload (same account); we only
// flip the dynamic flag, inject the amount, and recompute the CRC.
export function toDynamicQris(
  staticPayload: string,
  amountInt: number,
): string | null {
  const clean = staticPayload.replace(/\s+/g, "");
  const tlv = parseTLV(clean).filter((t) => t.tag !== "63");
  if (!tlv.some((t) => t.tag === "00")) return null; // not a QRIS payload
  const map = new Map<string, string>(
    tlv.map((t): [string, string] => [t.tag, t.value]),
  );
  map.set("01", "12");
  map.set("54", String(amountInt));
  const tags = [...map.keys()].sort((a, b) => Number(a) - Number(b));
  const body = tags.map((t) => emv(t, map.get(t)!)).join("") + "6304";
  return body + crc16(body);
}

// ═══════════════════════════ RECEIPT MODEL ═══════════════════════════
export interface ReceiptLine {
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptModel {
  store: string;
  address: string;
  footer: string;
  lines: ReceiptLine[];
  total: number;
  width: number;
  method: string;
  cashReceived: number;
  change: number;
  proof: boolean;
  time: string;
}

// Plain-text receipt (used for the preview + the print() fallback).
export function receiptText(m: ReceiptModel): string {
  const W = m.width;
  const center = (s: string): string => {
    s = s.slice(0, W);
    const pad = Math.max(0, Math.floor((W - s.length) / 2));
    return " ".repeat(pad) + s;
  };
  const lr = (l: string, r: string): string => {
    l = String(l);
    r = String(r);
    const room = W - r.length - 1;
    if (l.length > room) l = l.slice(0, room - 1) + "…";
    return l + " ".repeat(Math.max(1, W - l.length - r.length)) + r;
  };
  const rule = "-".repeat(W);
  const out: string[] = [];
  out.push(center(m.store));
  if (m.address)
    (m.address.match(new RegExp(".{1," + W + "}", "g")) ?? []).forEach((ln) =>
      out.push(center(ln)),
    );
  out.push(center(m.time));
  out.push(rule);
  for (const it of m.lines) {
    out.push(lr(it.name, ""));
    out.push(lr(`  ${it.qty} x ${fmt(it.price)}`, fmt(it.price * it.qty)));
  }
  out.push(rule);
  out.push(lr("TOTAL", fmt(m.total)));
  out.push(lr("Bayar", m.method));
  if (m.method === "Tunai" && m.cashReceived) {
    out.push(lr("Tunai", fmt(m.cashReceived)));
    out.push(lr("Kembalian", fmt(m.change)));
  }
  if (m.proof) out.push(lr("Bukti bayar", "terlampir"));
  out.push(rule);
  if (m.footer)
    (m.footer.match(new RegExp(".{1," + W + "}", "g")) ?? []).forEach((ln) =>
      out.push(center(ln)),
    );
  return out.join("\n");
}

// ESC/POS byte stream for a Bluetooth thermal printer.
export function escposBytes(m: ReceiptModel): Uint8Array {
  const bytes: number[] = [];
  const raw = (...b: number[]): void => {
    bytes.push(...b);
  };
  const txt = (s: string): void => {
    for (const b of UTF8.encode(s)) bytes.push(b);
  };
  const line = (s = ""): void => {
    txt(s);
    raw(0x0a);
  };
  const W = m.width;
  const lr = (l: string, r: string): string => {
    l = String(l);
    r = String(r);
    const room = W - r.length - 1;
    if (l.length > room) l = l.slice(0, room - 1) + "…";
    return l + " ".repeat(Math.max(1, W - l.length - r.length)) + r;
  };
  raw(0x1b, 0x40); // init
  raw(0x1b, 0x61, 0x01); // center
  raw(0x1d, 0x21, 0x11); // double width+height
  raw(0x1b, 0x45, 0x01); // bold on
  line(m.store);
  raw(0x1d, 0x21, 0x00);
  raw(0x1b, 0x45, 0x00); // normal, bold off
  if (m.address) line(m.address);
  line(m.time);
  raw(0x1b, 0x61, 0x00); // left
  line("-".repeat(W));
  for (const it of m.lines) {
    line(it.name);
    line(lr(`  ${it.qty} x ${fmt(it.price)}`, fmt(it.price * it.qty)));
  }
  line("-".repeat(W));
  raw(0x1b, 0x45, 0x01);
  line(lr("TOTAL", fmt(m.total)));
  raw(0x1b, 0x45, 0x00);
  line(lr("Bayar", m.method));
  if (m.method === "Tunai" && m.cashReceived) {
    line(lr("Tunai", fmt(m.cashReceived)));
    line(lr("Kembalian", fmt(m.change)));
  }
  if (m.proof) line(lr("Bukti bayar", "terlampir"));
  line("-".repeat(W));
  raw(0x1b, 0x61, 0x01); // center
  if (m.footer) line(m.footer);
  raw(0x0a, 0x0a, 0x0a); // feed
  raw(0x1d, 0x56, 0x42, 0x00); // partial cut (GS V B 0)
  return new Uint8Array(bytes);
}

// ═══════════════════════════ WEB BLUETOOTH ═══════════════════════════
// Common BLE thermal-printer service UUIDs (varies by model).
export const PRINTER_SERVICES: (number | string)[] = [
  0x18f0,
  0xff00,
  0xffe0,
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
];

// Minimal Web Bluetooth surface — the DOM lib does not ship these types under
// strict TS, so we declare only what this call path touches (no tsconfig change).
interface BleCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse(data: BufferSource): Promise<void>;
}
interface BleService {
  getCharacteristics(): Promise<BleCharacteristic[]>;
}
interface BleServer {
  getPrimaryServices(): Promise<BleService[]>;
  disconnect(): void;
}
interface BleDevice {
  gatt: { connect(): Promise<BleServer> };
}
interface BleBluetooth {
  requestDevice(opts: {
    acceptAllDevices?: boolean;
    optionalServices?: (number | string)[];
  }): Promise<BleDevice>;
}

export async function printBluetooth(bytes: Uint8Array): Promise<void> {
  const bt = (navigator as unknown as { bluetooth: BleBluetooth }).bluetooth;
  const device = await bt.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICES,
  });
  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();
  let ch: BleCharacteristic | null = null;
  for (const s of services) {
    for (const c of await s.getCharacteristics()) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        ch = c;
        break;
      }
    }
    if (ch) break;
  }
  if (!ch) throw new Error("Printer tidak punya karakteristik tulis yang dikenal.");
  const CHUNK = 180;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const part = bytes.slice(i, i + CHUNK);
    if (ch.properties.writeWithoutResponse)
      await ch.writeValueWithoutResponse(part);
    else await ch.writeValue(part);
    await new Promise((r) => setTimeout(r, 24));
  }
  try {
    server.disconnect();
  } catch {
    /* ignore */
  }
}

// ═══════════════════════════ TRANSACTIONS ═══════════════════════════
export interface TxnItem {
  name: string;
  qty: number;
  price: number;
}
export interface Txn {
  id: string;
  ts: string;
  method: string;
  total: number;
  cashReceived: number;
  change: number;
  proof: boolean;
  items: TxnItem[];
}

export const sameDay = (iso: string, ref: Date): boolean => {
  const a = new Date(iso);
  const b = ref;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

// Cash quick-fill denominations rounded up above the total (max 4).
export function roundUps(total: number): number[] {
  const denoms = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
  const out = new Set<number>();
  for (const d of denoms) {
    const up = Math.ceil(total / d) * d;
    if (up > total) out.add(up);
  }
  return [...out].sort((a, b) => a - b).slice(0, 4);
}

// Close-out (tutup kasir): plain-text daily summary for the printer/fallback.
export function rekapText(today: Txn[], store: string, W: number): string {
  const lr = (l: string, r: string): string => {
    l = String(l);
    r = String(r);
    const room = W - r.length - 1;
    if (l.length > room) l = l.slice(0, room - 1) + "…";
    return l + " ".repeat(Math.max(1, W - l.length - r.length)) + r;
  };
  const center = (s: string): string => {
    s = s.slice(0, W);
    return " ".repeat(Math.max(0, Math.floor((W - s.length) / 2))) + s;
  };
  const total = today.reduce((s, t) => s + t.total, 0);
  const out = [
    center(store),
    center("REKAP HARIAN"),
    center(
      new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    ),
    "-".repeat(W),
  ];
  for (const m of ["QRIS", "Transfer", "Tunai"]) {
    const rows = today.filter((t) => t.method === m);
    out.push(lr(`${m} (${rows.length})`, fmt(rows.reduce((s, t) => s + t.total, 0))));
  }
  out.push("-".repeat(W), lr(`TOTAL (${today.length})`, fmt(total)), "-".repeat(W));
  return out.join("\n");
}

/*
 * ── CRC16 self-check (EMVCo vector A13A) ─────────────────────────────
 * The canonical EMVCo MPM example ends with "6304A13A"; the CRC is computed
 * over everything up to and including "6304". It contains multibyte chars
 * (最佳运输 / 北京), so the checksum only comes out right when hashing UTF-8
 * bytes. Verified: crc16(EMVCO_A13A_DATA) === "A13A".
 *
 * const EMVCO_A13A_DATA =
 *   "00020101021229300012D156000000000510A93FO3230Q31280012D15600000001030812345678520441115802CN5914BEST TRANSPORT6007BEIJING64200002ZH0104最佳运输0202北京540523.7253031565502016233030412340603***0708A60086670902ME91320016A0112233449988770708123456786304";
 * console.assert(crc16(EMVCO_A13A_DATA) === "A13A");
 */
