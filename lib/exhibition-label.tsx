/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image is a PDF primitive, not an HTML img */
// Exhibition info-code placard. A small (A7) museum-style information card that
// sits beside a piece: a modern rounded-module QR as the hero, generous
// whitespace, the product name, and a quiet "Scan for more information" line.
//
// This is explicitly an INFORMATION placard, NOT a security document — no
// Verified Authentic styling, seals, or security iconography. Kept visually
// distinct from lib/certificate.tsx on purpose.

import type { ReactNode } from "react";
import { Document, Page, Text, View, Image, Svg, Rect, G, Font, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { resolvePalette, type BrandColors } from "@/lib/brand-page";
import { infoUrl } from "@/lib/exhibitions";

// Stop mid-word hyphenation (react-pdf hyphenates by default, which broke the
// "Scan for more information" caption into "INFORMA-TION").
Font.registerHyphenationCallback((word) => [word]);

export type InfoLabelData = {
  productName: string;
  brandName: string;
  token: string;
  logoDataUrl: string | null;
  colors: BrandColors;
};

// QR stays near-black on white regardless of brand theme so it is always
// high-contrast and reliably scannable in print.
const QR_DARK = "#0B0B0C";

// ── Modern vector QR ─────────────────────────────────────────────────────────
// Drawn from the raw module matrix as soft rounded squares, with the three
// finder patterns rendered as rounded "eyes" — a classier, more contemporary
// look than the default hard-square bitmap, while keeping module connectivity
// (so scanning stays reliable).
function QrArt({ url, size: px }: { url: string; size: number }) {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  const dark = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && !!data[r * n + c];

  // The 7×7 finder squares sit at three corners; we draw those as custom eyes.
  const finders: [number, number][] = [[0, 0], [0, n - 7], [n - 7, 0]];
  const inFinder = (r: number, c: number) =>
    finders.some(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);

  const cells: ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!dark(r, c) || inFinder(r, c)) continue;
      // Full-size rounded squares keep neighbours touching (reliable) while the
      // corner radius gives the soft, modern texture.
      cells.push(<Rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} rx={0.32} ry={0.32} fill={QR_DARK} />);
    }
  }

  const eyes = finders.map(([fr, fc], i) => (
    <G key={`eye-${i}`}>
      {/* Outer rounded ring (1-module stroke around a 7×7 box) */}
      <Rect x={fc + 0.5} y={fr + 0.5} width={6} height={6} rx={2} ry={2} fill="none" stroke={QR_DARK} strokeWidth={1} />
      {/* Inner rounded pupil (centre 3×3) */}
      <Rect x={fc + 2} y={fr + 2} width={3} height={3} rx={1} ry={1} fill={QR_DARK} />
    </G>
  ));

  return (
    <Svg width={px} height={px} viewBox={`0 0 ${n} ${n}`}>
      {cells}
      {eyes}
    </Svg>
  );
}

export async function renderInfoLabel(data: InfoLabelData): Promise<Buffer> {
  const palette = resolvePalette(data.colors);
  const url = infoUrl(data.token);

  const doc = (
    <Document title={`${data.productName} — Information`}>
      <Page
        size="A7"
        style={{
          paddingTop: 24,
          paddingBottom: 22,
          paddingHorizontal: 24,
          backgroundColor: palette.background,
          color: palette.textPrimary,
          fontFamily: "Helvetica",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Brand mark */}
        <View style={{ alignItems: "center" }}>
          {data.logoDataUrl ? (
            <Image src={data.logoDataUrl} style={{ height: 20, maxWidth: 104, objectFit: "contain" }} />
          ) : (
            <Text style={{ fontFamily: "Times-Italic", fontSize: 13, color: palette.textPrimary }}>{data.brandName}</Text>
          )}
        </View>

        {/* Centre block: QR hero + caption + product name */}
        <View style={{ flexGrow: 1, justifyContent: "center", alignItems: "center", width: "100%" }}>
          <View
            style={{
              padding: 12,
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#EEEEEE",
            }}
          >
            <QrArt url={url} size={118} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 16 }}>
            <View style={{ width: 4, height: 4, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
            <Text style={{ fontSize: 7, letterSpacing: 1.1, textTransform: "uppercase", color: palette.accent }}>
              Scan for more information
            </Text>
            <View style={{ width: 4, height: 4, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
          </View>

          <Text
            style={{
              fontFamily: "Times-Roman",
              fontSize: 16,
              textAlign: "center",
              color: palette.textPrimary,
              marginTop: 9,
              lineHeight: 1.2,
              maxWidth: 150,
            }}
          >
            {data.productName}
          </Text>
        </View>

        {/* Footer (in normal flow — never overlaps the name) */}
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 22, height: 1, backgroundColor: palette.divider, marginBottom: 8 }} />
          <Text style={{ fontSize: 6.5, color: palette.textSecondary, marginBottom: 5 }}>Reference information only</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 3, height: 3, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
            <Text style={{ fontSize: 6, letterSpacing: 1.3, textTransform: "uppercase", color: palette.textSecondary }}>
              Powered by Tagit
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}

/** Filesystem-safe label filename from a product name. */
export function labelFileName(productName: string, ext = "pdf"): string {
  const base = productName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "label";
  return `${base}.${ext}`;
}
