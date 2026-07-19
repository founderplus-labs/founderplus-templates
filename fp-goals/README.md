# fp-goals — OKR / Goals core

Domain core untuk sistem **OKR ala Operately**, mengimplementasikan spec
[`0009`–`0012`](../specs/). Framework-agnostic (TypeScript murni, tanpa React) —
dipakai sebagai lapisan domain di app **TanStack Start (`fp-fullstack`)**; lapisan
HTTP/UI cukup membungkus fungsi & `GoalsService` di sini. (Kita **tidak**
merekomendasikan Next.js.)

> Ini bagian yang paling "keras" dari OKR: matematika progres, rollup pohon, dan
> aturan alur (champion/reviewer, state machine). Semua ter-spec dan **teruji**.

## Isi

```
src/core/
  types.ts       Tipe domain (Goal, Target, CheckIn, GoalTreeNode, …)
  progress.ts    computeTargetProgress (naik/turun/clamp/no-div0) + rollup goal   ← spec 0010
  validate.ts    champion≠reviewer, timeframe, anti-siklus parent                 ← spec 0009
  checkin.ts     cadence/overdue, worst-wins, snapshot, gate alasan off_track     ← spec 0011
  tree.ts        buildGoalTree — rollup progres (berbobot) & status (worst-wins)  ← spec 0012
  service.ts     GoalsService in-memory: API contract + otorisasi + close FSM
  *.test.ts      29 test membuktikan acceptance criteria spec
src/demo.ts      skenario end-to-end (company → space → goal → check-in → tree)
```

## Jalankan

```bash
npm install                 # hanya devDeps (typescript + @types/node)
npm test                    # node --test, 29 pass
npm run typecheck           # tsc --noEmit, bersih
npm run demo                # cetak Work Map + deteksi overdue
```

Butuh Node ≥ 22.6 (memakai `--experimental-strip-types` untuk menjalankan `.ts`
langsung — tanpa build step).

## Contoh output demo

```
OKR Work Map — Q1 2026
• Reach 1,000 paying founders  [own — · rollup 50% · off_track]
  • Grow new signups  [own 65% · rollup 65% · on_track]
  • Reduce churn  [own 20% · rollup 20% · off_track]
```

Rollup perusahaan `50%` = rata-rata berbobot anak (65%×2 + 20%×1)/3; status
`off_track` menang (worst-wins) dari "Reduce churn".

## Memakai di app (TanStack Start)

```ts
import { GoalsService } from "fp-goals/src/core/service.ts";

const goals = new GoalsService(); // atau inject { now, idGen } + adapter DB
// server action / loader tinggal memanggil:
goals.createGoal(actorId, input);
goals.createCheckIn(actorId, goalId, { status, narrative, targetUpdates });
const tree = goals.getGoalTree({ spaceId });
```

`GoalsService` menyimpan state di `Map` (in-memory) agar deterministik & teruji.
Untuk produksi, ganti store-nya dengan adapter database (tabel goals/targets/
check-ins) — antarmuka methodnya tetap sama.

## Peta spec → kode

| Spec | Diimplementasikan | Belum (butuh lapisan UI/HTTP app) |
|------|-------------------|-----------------------------------|
| 0009 Goal | validasi, CRUD, parent anti-siklus, close FSM, otorisasi | form React, halaman detail |
| 0010 Targets | progres naik/turun/clamp/no-div0, rollup berbobot, unit | progress bar UI, editor nilai |
| 0011 Check-in | status R/Y/G, snapshot, gate alasan, ack reviewer, cadence/overdue | timeline UI, pengingat terjadwal |
| 0012 Tree | buildGoalTree, rollup progres+status, filter, orphan→root | peta interaktif, drill-down, a11y keyboard |

Checkbox di tiap file spec dicentang persis untuk item yang **sudah terverifikasi**
oleh test di sini; item UI/e2e dibiarkan terbuka.
