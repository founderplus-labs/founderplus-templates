import { useState, type ComponentType } from "react";
import { LinkInBio } from "./templates/LinkInBio.tsx";
import { PremiumLanding } from "./templates/PremiumLanding.tsx";

/**
 * Showcase shell. Each template is a self-contained component that owns its own
 * config, styling and behaviour — the shell only picks which one to mount.
 * A real deployment would render a single template as its own app root.
 */
interface Entry {
  id: string;
  name: string;
  blurb: string;
  Component: ComponentType;
}

const TEMPLATES: Entry[] = [
  {
    id: "premium-landing",
    name: "Premium landing",
    blurb: "Landing gelap premium — hero, fitur, angka count-up, harga, CTA.",
    Component: PremiumLanding,
  },
  {
    id: "link-in-bio",
    name: "Link in bio",
    blurb: "Microsite kreator — avatar, sosial, tombol tautan & checkout Founder+.",
    Component: LinkInBio,
  },
];

export function App() {
  const [activeId, setActiveId] = useState(TEMPLATES[0].id);
  const active = TEMPLATES.find((t) => t.id === activeId) ?? TEMPLATES[0];
  const Active = active.Component;

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50 text-neutral-900 md:flex-row dark:bg-neutral-950 dark:text-neutral-100">
      <aside className="shrink-0 border-b border-neutral-200 bg-white/70 p-4 backdrop-blur md:w-72 md:border-r md:border-b-0 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="mb-4 flex items-center gap-2">
          <span className="size-6 rounded-md bg-gradient-to-br from-brand-1 via-brand-4 to-brand-6" />
          <span className="text-sm font-semibold tracking-tight">Founder+ Templates</span>
        </div>
        <nav className="flex flex-col gap-1">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={[
                "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                t.id === activeId
                  ? "bg-accent/10 font-semibold text-accent-ink dark:text-accent-soft"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
              ].join(" ")}
            >
              {t.name}
              <span className="mt-0.5 block text-xs font-normal text-neutral-400">{t.blurb}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Active />
      </main>
    </div>
  );
}
