#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// Founder+ spec progress — dependency-free checklist meter.
//
//   node specs/progress.mjs                 # semua specs/*.spec.yaml
//   node specs/progress.mjs specs/0001-*.yaml
//
// Menghitung item checklist (`done: true|false`) di seluruh acceptance_criteria,
// tasks, test_plan, dan definition_of_done. Tidak butuh parser YAML — cukup
// menghitung penanda `done:` sehingga zero-dependency & aman di CI.
// ────────────────────────────────────────────────────────────────────────────
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function specFiles(args) {
  if (args.length) return args;
  return readdirSync(here)
    .filter((f) => f.endsWith(".spec.yaml") && !f.startsWith("_"))
    .sort()
    .map((f) => join(here, f));
}

function field(src, name) {
  const m = src.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?`, "m"));
  return m ? m[1].trim() : "";
}

function bar(pct, width = 24) {
  const on = Math.round((pct / 100) * width);
  return "█".repeat(on) + "░".repeat(width - on);
}

let gTotal = 0;
let gDone = 0;
const rows = [];

for (const file of specFiles(process.argv.slice(2))) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    console.error(`skip (unreadable): ${file}`);
    continue;
  }
  const done = (src.match(/^\s*(?:-\s+)?done:\s*true\b/gim) || []).length;
  const open = (src.match(/^\s*(?:-\s+)?done:\s*false\b/gim) || []).length;
  const total = done + open;
  const pct = total ? Math.round((done / total) * 100) : 0;
  gTotal += total;
  gDone += done;
  rows.push({
    id: field(src, "id") || basename(file),
    status: field(src, "status"),
    title: field(src, "title"),
    done,
    total,
    pct,
  });
}

const w = Math.max(...rows.map((r) => r.title.length), 5);
console.log("");
for (const r of rows) {
  console.log(
    `${r.id.padEnd(5)} [${(r.status || "-").padEnd(11)}] ${bar(r.pct)} ${String(
      r.pct
    ).padStart(3)}%  ${r.done}/${r.total}  ${r.title.padEnd(w)}`
  );
}
const gp = gTotal ? Math.round((gDone / gTotal) * 100) : 0;
console.log("");
console.log(
  `TOTAL              ${bar(gp)} ${String(gp).padStart(3)}%  ${gDone}/${gTotal} checklist item`
);
console.log("");
