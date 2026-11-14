import { ChevronDown } from "lucide-react";
import { rosette } from "@/components/landing/interactive/guilloche";
import { TagitMarkGlyph } from "@/components/ui/TagitMarkGlyph";
import type { ScanTheme } from "@/lib/brand-page";
import s from "./consumer.module.css";

/**
 * The shared bones of the pages a buyer reaches from a tag or a certificate.
 * Server components; the forms that sit inside them are the only client code.
 */

export { s as scanStyles };

/** The brand's colours as the custom properties consumer.module.css reads. */
export function themeVars(theme: ScanTheme, baseFont?: string): React.CSSProperties {
  return {
    "--brand": theme.brand,
    "--on-brand": theme.onBrand,
    "--accent-on-brand": theme.accentOnBrand,
    "--accent-ink": theme.accentInk,
    "--button": theme.button,
    "--on-button": theme.onButton,
    ...(baseFont ? { "--base-font": baseFont } : {}),
  } as React.CSSProperties;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Tagit's seal: a dial of ticks around the Tagit mark, drawn in currentColor. */
export function ScanSeal({ size = 96 }: { size?: number }) {
  const r = 38;
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = ((i * 10 - 90) * Math.PI) / 180;
    const inner = i % 3 === 0 ? r * 0.74 : r * 0.82;
    return {
      i,
      x1: round(40 + Math.cos(a) * inner),
      y1: round(40 + Math.sin(a) * inner),
      x2: round(40 + Math.cos(a) * r * 0.92),
      y2: round(40 + Math.sin(a) * r * 0.92),
    };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden style={{ display: "block" }}>
      <circle cx="40" cy="40" r={r} stroke="currentColor" strokeWidth="1.3" />
      {ticks.map((t) => (
        <line key={t.i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeOpacity={t.i % 3 === 0 ? 0.9 : 0.45} strokeLinecap="round" />
      ))}
      <TagitMarkGlyph cx={40} cy={40} size={44} paint="currentColor" />
    </svg>
  );
}

const ENGRAVING = [rosette(240, 7, 96), rosette(184, 11, 64)];

function Engraving() {
  return (
    <svg className={s.heroEngraving} viewBox="-260 -260 520 520" aria-hidden>
      {ENGRAVING.map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeWidth={0.7} fill="none" strokeOpacity={1 - i * 0.35} />
      ))}
    </svg>
  );
}

/**
 * The verification block: who made the piece, and Tagit's verdict on it, in
 * the brand's own colour. It is the first thing a tap shows, so it says the one
 * thing the buyer came to learn before anything else.
 */
export function VerificationHero({
  house,
  logoUrl,
  verdict,
  note,
  meta,
  seal = true,
}: {
  house: string;
  logoUrl?: string | null;
  verdict: string;
  note: React.ReactNode;
  meta?: React.ReactNode[];
  seal?: boolean;
}) {
  return (
    <header className={s.hero}>
      {seal && <Engraving />}
      <div className={s.column}>
        <div className={s.heroTop}>
          <div className={s.house}>
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className={s.houseLogo} />
            )}
            <span className={s.houseName}>{house}</span>
          </div>
          <a href="https://tagitlux.com" className={s.byTagit} target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 307 307" aria-hidden>
              <TagitMarkGlyph cx={153.5} cy={153.5} size={307} paint="currentColor" />
            </svg>
            Tagit
          </a>
        </div>
        <div className={s.heroBody}>
          {seal && (
            <div className={s.heroSeal}>
              <ScanSeal size={92} />
            </div>
          )}
          <h1 className={s.verdict}>{verdict}</h1>
          <p className={s.verdictNote}>{note}</p>
          {meta && meta.length > 0 && (
            <div className={s.heroMeta}>
              {meta.map((m, i) => (
                <div key={i}>{m}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={s.heroEdge} />
    </header>
  );
}

export type RecordEntry = {
  id: string;
  name: string;
  meta: React.ReactNode;
  current: boolean;
};

/** The ownership record, oldest first, the current owner marked. */
export function OwnershipRecord({ entries }: { entries: RecordEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section className={s.section} aria-labelledby="record-heading">
      <h2 id="record-heading" className={s.h2}>
        The record
        <small>
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </small>
      </h2>
      <ol className={`${s.panel} ${s.record}`}>
        {entries.map((e) => (
          <li key={e.id} className={`${s.entry} ${e.current ? "" : s.entryPast}`}>
            <span aria-hidden className={`${s.dot} ${e.current ? s.dotCurrent : ""}`} />
            <div>
              <p className={s.entryName}>
                {e.name}
                {e.current && <span className={s.tagOk}>Current owner</span>}
              </p>
              <p className={s.entryMeta}>{e.meta}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A row that opens: the piece's longer details and stories. */
export function Disclosure({
  title,
  count,
  open,
  children,
}: {
  title: string;
  count?: number;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className={s.disclosure} open={open}>
      <summary>
        <span>
          {title}
          {count ? <small>{count}</small> : null}
        </span>
        <ChevronDown size={17} className={s.chev} aria-hidden />
      </summary>
      <div className={s.disclosureBody}>{children}</div>
    </details>
  );
}

export function Facts({ items }: { items: { key: string; label: string; value: string }[] }) {
  if (items.length === 0) return null;
  return (
    <dl className={s.facts}>
      {items.map((f) => (
        <div key={f.key} className={s.fact}>
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The foot of every scan page: what Tagit is, in one line. */
export function ScanFooter({ note }: { note?: string }) {
  return (
    <footer className={s.footer}>
      <a href="https://tagitlux.com" className={s.footerMark} target="_blank" rel="noopener noreferrer">
        <svg width="20" height="20" viewBox="0 0 307 307" aria-hidden>
          <TagitMarkGlyph cx={153.5} cy={153.5} size={307} paint="#B9955D" />
        </svg>
        Verified by Tagit
      </a>
      <p className={s.footerNote}>
        {note ?? "Tagit keeps a permanent record of who made a piece and everyone who has owned it."}
      </p>
    </footer>
  );
}
