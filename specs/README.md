# Founder+ Spec System

Sistem spec berbasis **YAML + checklist** untuk ekosistem template Founder+.
Terinspirasi dari cara [operately/operately](https://github.com/operately/operately/tree/main/specs)
menulis satu file spec bernomor per fitur — di sini diekspresikan sebagai
**YAML** yang bisa divalidasi mesin, diorganisir **per vertical slice → JTBD →
user story → acceptance criteria**, dengan checkbox sebagai sumber kebenaran
progres.

> Satu file = satu **vertical slice** = satu hal yang bisa **dilakukan** user,
> nembus semua lapisan (UI → logic → data → integrasi). Bukan lapisan
> horizontal, bukan "epic" raksasa.

---

## Kenapa begini

| Prinsip | Wujudnya di sini |
|---|---|
| **Spec-driven** (bukan kode duluan) | Slice ditulis sebelum/ sejalan implementasi; kontrak eksplisit. |
| **Vertical slice** | `slice:` memaksa cantumkan tiap lapisan yang disentuh — bukti ini benar end-to-end. |
| **JTBD dulu, fitur belakangan** | `jtbd:` menangkap *kemajuan* yang orang kejar, dengan `signal` (metrik sukses). |
| **User story granular** | Tiap `user_stories[]` bawa `acceptance_criteria` (Given/When/Then) sendiri. |
| **Checklist = status** | Setiap `done: true|false` dihitung `progress.mjs` → % objektif, bukan tebakan. |
| **Machine-checkable** | `schema/spec.schema.json` + modeline `yaml-language-server` = validasi & autocomplete di editor. |

Analog ke section spec Operately (Summary · Problem · Goals · Non-goals ·
Decisions · Data model · API contract · Implementation phases dengan `- [ ]` ·
Definition of Done), tapi field-nya terstruktur agar bisa di-tool-ing.

---

## Anatomi satu file

```
specs/
  README.md                     ← kamu di sini (metodologi)
  _TEMPLATE.spec.yaml           ← salin ini untuk slice baru
  schema/spec.schema.json       ← kontrak bentuk (JSON Schema)
  progress.mjs                  ← meter checklist, zero-dependency
  NNNN-<slug>.spec.yaml         ← satu slice per file, bernomor urut
```

Hirarki isi tiap spec:

```
slice (vertical)
└─ jtbd[]                 WHY  — job + signal (metrik sukses)
   └─ user_stories[]      HOW  — per persona/peran
      ├─ acceptance_criteria[]   ✔ Given/When/Then  (story "done" kalau semua ✔)
      ├─ tasks[]                 ✔ langkah implementasi
      └─ edge_cases[]
definition_of_done[]      ✔ gerbang akhir sebelum status → shipped
```

Field lengkap + komentar: lihat [`_TEMPLATE.spec.yaml`](./_TEMPLATE.spec.yaml).
Bentuk yang divalidasi: [`schema/spec.schema.json`](./schema/spec.schema.json).

---

## Lifecycle (`status`)

```
draft ──▶ in_review ──▶ in_progress ──▶ shipped ──▶ (archived)
```

- **draft** — ditulis, belum disepakati. Checkbox umumnya kosong (0%).
- **in_review** — sedang direview; kontrak & non-goals dikunci.
- **in_progress** — implementasi jalan; checkbox mulai ✔.
- **shipped** — semua `acceptance_criteria` + `definition_of_done` ✔.
- **archived** — digantikan/ tidak relevan (jangan dihapus; simpan sejarah).

Status **tidak boleh** `shipped` selama masih ada checkbox `definition_of_done`
yang `false`.

---

## Cara pakai

**Bikin slice baru**

```bash
cp specs/_TEMPLATE.spec.yaml specs/0009-nama-slice.spec.yaml
# edit id, slug, isi jtbd → user_stories → acceptance_criteria, set status: draft
```

Aturan penomoran: 4 digit, urut, sekali dipakai tidak didaur ulang. `slug` &
prefix nomor **harus** sama dengan nama file.

**Lihat progres (objektif, dari checkbox)**

```bash
node specs/progress.mjs                    # semua slice
node specs/progress.mjs specs/0006-*.yaml  # satu slice
```

```
0006  [shipped    ] ████████████████████████ 100%  19/19  Kasir: bayar (QRIS/transfer/tunai)…
0008  [draft      ] ░░░░░░░░░░░░░░░░░░░░░░░░   0%  0/13  Sinkron POS multi-device…
TOTAL              █████████████████████░░░  88%  98/111 checklist item
```

**Validasi bentuk saat menulis**
Tiap spec diawali modeline:

```yaml
# yaml-language-server: $schema=./schema/spec.schema.json
```

Editor dengan YAML Language Server (VS Code + ekstensi YAML, Neovim, dll)
langsung memberi autocomplete + error kalau field salah. Untuk cek di CI, jalankan
validator JSON-Schema apa pun yang paham YAML terhadap `schema/spec.schema.json`.

---

## Aturan menulis (biar konsisten)

1. **Satu slice, satu file.** Kalau butuh dua kalimat "dan" untuk menjelaskan
   scope, kemungkinan itu dua slice.
2. **JTBD bukan fitur.** Tulis situasi + motivasi + hasil, lengkapi `signal`
   (metrik yang membuktikan job selesai *dengan baik*).
3. **Acceptance criteria = Given/When/Then** yang bisa diobservasi/diuji. Kalau
   tidak bisa dicentang objektif, pertajam dulu.
4. **Non-goals wajib.** Menyebut yang *tidak* dikerjakan mencegah scope creep.
5. **Kontrak eksplisit.** Config block, atribut HTML, atau bentuk API taruh di
   `contracts:` — itu yang stabil dan dijanjikan ke pemakai template.
6. **Checkbox jujur.** `done: true` hanya kalau benar-benar terverifikasi (uji
   di `test_plan`), bukan "kayaknya beres".

---

## Indeks slice

| ID | Slice | App | Status |
|----|-------|-----|--------|
| [0001](./0001-funnel-buy-button.spec.yaml) | Tombol Beli funnel-tracker | funnel-tracker-cdn | shipped |
| [0002](./0002-countdown-urgency.spec.yaml) | Countdown urgency | funnel-tracker-cdn | shipped |
| [0003](./0003-sticky-cta.spec.yaml) | Sticky CTA | funnel-tracker-cdn | shipped |
| [0004](./0004-utm-attribution-tracking.spec.yaml) | Tracking & atribusi UTM | funnel-tracker-cdn | shipped |
| [0005](./0005-pos-table-ordering.spec.yaml) | Pesan dari meja via QR | pos-qr-menu | shipped |
| [0006](./0006-pos-cashier-qris-receipt.spec.yaml) | Kasir: QRIS/struk/rekap | pos-qr-menu | shipped |
| [0007](./0007-fp-fullstack-product-gate.spec.yaml) | Product gate + owner bypass | fp-fullstack | shipped |
| [0008](./0008-pos-multi-device-sync.spec.yaml) | Sinkron POS multi-device | pos-qr-menu | draft |
| [0009](./0009-okr-goal-definition.spec.yaml) | **OKR** — definisi Goal (champion/reviewer/timeframe/parent) | fp-goals | in_progress |
| [0010](./0010-okr-targets-progress.spec.yaml) | **OKR** — Targets/Key Results & progres otomatis | fp-goals | in_progress |
| [0011](./0011-okr-check-in-review.spec.yaml) | **OKR** — Check-in bulanan (R/Y/G) & review | fp-goals | in_progress |
| [0012](./0012-okr-alignment-tree.spec.yaml) | **OKR** — Pohon alignment & rollup | fp-goals | in_progress |
| [0013](./0013-okr-permissions-collaboration.spec.yaml) | **OKR** — Permissions, checklist & kolaborasi | fp-goals | in_progress |

> Slice `0001–0007` mendokumentasikan perilaku yang **sudah ada** di template
> (spec sebagai kebenaran hidup). `0008` adalah slice **yang direncanakan**
> (checkbox kosong). `0009–0012` sedang **in_progress**: domain core-nya sudah
> dibangun & diuji di [`../fp-goals/`](../fp-goals/) (checkbox logic/service
> tercentang), UI/reminder/e2e masih terbuka.

### Cluster OKR (`fp-goals`) — sistem OKR ala Operately

Empat slice yang saling menggantung membentuk sistem OKR lengkap:

```
0009 Goal (Objective)   champion · reviewer · timeframe · parent · space
  └─ 0010 Targets/KR     from → to → value (unit/index) → progres otomatis + rollup
       └─ 0011 Check-in  status R/Y/G + narasi + snapshot + ack reviewer + penjadwalan
            └─ 0012 Tree company → space → goal → sub-goal, rollup progres & status
                 └─ 0013 Permissions (access level + role) · checklist · reactions/comments · retrospective
```

Diperdalam dari studi source Operately (`app/lib/operately/goals` + `access`).

Reference implementation menargetkan **TanStack Start (`fp-fullstack`)** — kita
**tidak** merekomendasikan Next.js. Domain core-nya sudah dibangun & diuji di
[`../fp-goals/`](../fp-goals/) (TypeScript murni, **29 test lulus**,
`tsc --noEmit` bersih) — jalankan `npm --prefix fp-goals run demo` untuk melihat
Work Map ter-rollup, dan `npm --prefix fp-goals test` untuk membuktikan
acceptance criteria.

Perbarui tabel ini + kolom `status` tiap kali menambah/menaikkan slice.
