/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image is a PDF primitive, not an HTML img */
// Exhibition info-code placard. A small (A7) museum-style information card that
// sits beside a piece: a crisp QR as the hero, generous whitespace, the product
// name, and a quiet "Scan for more information" line.
//
// This is explicitly an INFORMATION placard, NOT a security document. It carries
// no Verified Authentic styling, no seals, no security iconography — kept
// visually distinct from lib/certificate.tsx on purpose.

import { Document, Page, Text, View, Image, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { resolvePalette, type BrandColors } from "@/lib/brand-page";
import { infoUrl } from "@/lib/exhibitions";

export type InfoLabelData = {
  productName: string;
  brandName: string;
  token: string;
  logoDataUrl: string | null;
  colors: BrandColors;
};

// QR modules stay near-black on white regardless of brand theme so the code is
// always high-contrast and reliably scannable in print. Brand colour lives in
// the accent rule and type, not the modules.
const QR_DARK = "#0B0B0C";

async function buildQr(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 0,
    width: 1024, // high-res so the printed code stays crisp
    errorCorrectionLevel: "M",
    color: { dark: QR_DARK, light: "#FFFFFF" },
  });
}

export async function renderInfoLabel(data: InfoLabelData): Promise<Buffer> {
  const palette = resolvePalette(data.colors);
  const qr = await buildQr(infoUrl(data.token));

  const doc = (
    <Document title={`${data.productName} — Information`}>
      <Page
        size="A7"
        style={{
          paddingTop: 26,
          paddingBottom: 22,
          paddingHorizontal: 26,
          backgroundColor: palette.background,
          color: palette.textPrimary,
          fontFamily: "Helvetica",
          alignItems: "center",
        }}
      >
        {/* Brand mark */}
        {data.logoDataUrl ? (
          <Image src={data.logoDataUrl} style={{ height: 22, maxWidth: 110, objectFit: "contain", marginBottom: 4 }} />
        ) : (
          <Text style={{ fontFamily: "Times-Italic", fontSize: 14, color: palette.textPrimary }}>{data.brandName}</Text>
        )}

        {/* QR hero — a clean white tile, crisp and modern */}
        <View
          style={{
            marginTop: 16,
            padding: 11,
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#ECECEC",
          }}
        >
          <Image src={qr} style={{ width: 116, height: 116 }} />
        </View>

        {/* Scan prompt */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 }}>
          <View style={{ width: 5, height: 5, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
          <Text style={{ fontSize: 8, letterSpacing: 1.6, textTransform: "uppercase", color: palette.accent }}>
            Scan for more information
          </Text>
        </View>

        {/* Product name */}
        <Text
          style={{
            fontFamily: "Times-Roman",
            fontSize: 15,
            textAlign: "center",
            color: palette.textPrimary,
            marginTop: 10,
            lineHeight: 1.2,
          }}
        >
          {data.productName}
        </Text>

        {/* Footer: reference disclaimer + small wordmark */}
        <View style={{ position: "absolute", bottom: 16, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ fontSize: 6.5, color: palette.textSecondary, marginBottom: 4 }}>
            Reference information only
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 3, height: 3, backgroundColor: palette.accent, transform: "rotate(45deg)" }} />
            <Text style={{ fontSize: 6, letterSpacing: 1.4, textTransform: "uppercase", color: palette.textSecondary }}>
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
