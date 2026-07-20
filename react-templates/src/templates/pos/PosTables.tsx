import { useMemo, useState } from "react";
import qrcode from "qrcode-generator";
import "./postables.css";

// Build the list of table labels: prefix + running number (1..count).
function tableLabels(count: number, prefix: string): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) out.push((prefix || "") + i);
  return out;
}

// Per-table deep link into the published menu: <host>/?meja=<label>
function buildUrl(base: string, label: string): string {
  const clean = base.trim().replace(/\/+$/, "");
  return `${clean}/?meja=${encodeURIComponent(label)}`;
}

// Error correction "M" balances density vs. resilience on a laminated
// table card. typeNumber 0 = auto-fit to the data length.
function qrSvg(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}

interface Committed {
  store: string;
  base: string;
  count: string;
  prefix: string;
}

const INITIAL: Committed = {
  store: "Warung Kopi Founder+",
  base: "https://tokomu.host.founderplus.id",
  count: "12",
  prefix: "",
};

export function PosTables() {
  // Controlled input values.
  const [store, setStore] = useState(INITIAL.store);
  const [base, setBase] = useState(INITIAL.base);
  const [count, setCount] = useState(INITIAL.count);
  const [prefix, setPrefix] = useState(INITIAL.prefix);

  // Grid is only (re)built when "Buat" is clicked (and once on mount),
  // matching the source's render()-on-click behaviour.
  const [committed, setCommitted] = useState<Committed>(INITIAL);

  const cards = useMemo(() => {
    const storeName = committed.store.trim() || "Menu";
    const n = Math.max(1, Math.min(200, Number(committed.count) || 1));
    const px = committed.prefix.trim();
    return tableLabels(n, px).map((label) => {
      const url = buildUrl(committed.base, label);
      return { label, url, svg: qrSvg(url), store: storeName };
    });
  }, [committed]);

  const generate = () => setCommitted({ store, base, count, prefix });

  return (
    <div data-tpl="pos-tables">
      <div className="bar">
        <h1>Cetak QR Meja</h1>
        <label className="field">
          Nama tempat
          <input
            type="text"
            value={store}
            onChange={(e) => setStore(e.target.value)}
          />
        </label>
        <label className="field">
          URL menu (host publikmu)
          <input
            type="text"
            placeholder="https://tokomu.host.founderplus.id"
            value={base}
            onChange={(e) => setBase(e.target.value)}
          />
        </label>
        <label className="field">
          Jumlah meja
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
        <label className="field">
          Prefix (opsional)
          <input
            type="text"
            placeholder="mis. A"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            style={{ width: "110px" }}
          />
        </label>
        <button className="go" type="button" onClick={generate}>
          Buat
        </button>
        <button className="print" type="button" onClick={() => window.print()}>
          Print / PDF
        </button>
      </div>
      <p className="hint">
        Isi URL menu = alamat tempat kamu publish <code>index.html</code> (mis. hasil{" "}
        <code>fp sites publish</code>). Tiap meja dapat QR yang membuka{" "}
        <code>…/?meja=&lt;nomor&gt;</code>. Klik <b>Print / PDF</b>, potong, taruh di tiap meja.
      </p>
      <div className="grid">
        {cards.map((c) => (
          <div className="card" key={c.label}>
            <div className="store">{c.store}</div>
            <div className="meja">Meja {c.label}</div>
            <div className="qr" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <div className="scan">Scan untuk lihat menu &amp; pesan</div>
            <div className="url">{c.url}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
