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
  types.ts        Tipe domain setia Operately (Goal, Target from/to/value/index,
                  GoalCheck, CheckIn dgn snapshot+reactions+comments, Space/members)
  progress.ts     target progress (naik/turun/clamp/no-div0) + rollup + format_value ← 0010
  validate.ts     champion≠reviewer, timeframe, anti-siklus parent                    ← 0009
  checks.ts       checklist "checks" per goal (done/total)                            ← 0013
  permissions.ts  AccessLevel view/comment/edit/full + gate champion/reviewer         ← 0013
  projects.ts     project progress (milestone done/total) + health                    ← 0014
  checkin.ts      penjadwalan (next_update), worst-wins, snapshot, gate off_track     ← 0011
  tree.ts         buildGoalTree — rollup goal + sub-goal + project (worst-wins)        ← 0012/0014
  service.ts      GoalsService in-memory: API contract + authz access-level + close FSM
  *.test.ts       49 test membuktikan acceptance criteria spec
src/demo.ts       skenario end-to-end (goal → target → check-in → project/milestone → Work Map)
```

## Jalankan

```bash
npm install                 # hanya devDeps (typescript + @types/node)
npm test                    # node --test, 49 pass
npm run typecheck           # tsc --noEmit, bersih
npm run demo                # cetak Work Map + izin + deteksi overdue
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
| 0010 Targets | progres naik/turun/clamp/no-div0, rollup berbobot, format_value | progress bar UI, editor nilai |
| 0011 Check-in | status R/Y/G, snapshot target+check+timeframe, gate alasan, ack, penjadwalan/overdue | timeline UI, dispatch pengingat |
| 0012 Tree | buildGoalTree, rollup progres+status, filter, orphan→root | peta interaktif, drill-down, a11y keyboard |
| 0013 Permissions | access level view/comment/edit/full + role gates, checklist, reactions/comments, retrospective | tombol ber-permission, UI checklist/komentar |
| 0014 Projects | project→goal, milestone done/total, project check-in health, daun Work Map + rollup | UI Work Map node project, halaman project/milestone |

Model mengikuti source Operately (`app/lib/operately/goals` + `projects` +
`access`): Target `from/to/unit/value/index`, Update (check-in) dgn
`state`/snapshot/`reactions`/`comments`, Goal `next_update_scheduled_at`/
`last_update_status`/`closed_*`/`success_status`, Check `name/completed/index`,
Project `health`/`last_check_in_status`/`success_status` + Milestone
`status:pending|done`/`completed_at`, dan Access.Binding
`view=10/comment=40/edit=70/full=100`.

Checkbox di tiap file spec dicentang persis untuk item yang **sudah terverifikasi**
oleh test di sini; item UI/e2e dibiarkan terbuka.
