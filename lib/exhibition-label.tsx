/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image is a PDF primitive, not an HTML img */
// Exhibition info-code placard. A small (A6) museum-style information card that
// sits beside a piece: calm typography, generous whitespace, the QR code, the
// product name, and a quiet "Scan for more information" line.
//
// This is explicitly an INFORMATION placard, NOT a security document. It must
// carry no Verified Authentic styling, no seals, no security iconography — kept
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

async function buildQr(url: string, dark: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 320,
    color: { dark, light: "#FFFFFF" },
  });
}

export async function renderInfoLabel(data: InfoLabelData): Promise<Buffer> {
  const palette = resolvePalette(data.colors);
  const qr = await buildQr(infoUrl(data.token), palette.textPrimary);

  const doc = (
    <Document title={`${data.productName} — Information`}>
      <Page
        size="A6"
        style={{
          paddingTop: 34,
          paddingBottom: 30,
          paddingHorizontal: 34,
          backgroundColor: palette.background,
          color: palette.textPrimary,
          fontFamily: "Helvetica",
          alignItems: "center",
        }}
      >
        {/* Brand line */}
        <View style={{ alignItems: "center", marginBottom: 4 }}>
          {data.logoDataUrl ? (
            <Image src={data.logoDataUrl} style={{ width: 30, height: 30, objectFit: "contain", marginBottom: 8 }} />
          ) : null}
          <Text style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: palette.textSecondary }}>
            {data.brandName}
          </Text>
        </View>

        {/* Product name */}
        <Text
          style={{
            fontFamily: "Times-Roman",
            fontSize: 17,
            textAlign: "center",
            color: palette.textPrimary,
            marginTop: 14,
            marginBottom: 4,
            lineHeight: 1.25,
          }}
        >
          {data.productName}
        </Text>

        <View style={{ width: 28, height: 1, backgroundColor: palette.accent, marginVertical: 16 }} />

        {/* QR */}
        <View
          style={{
            padding: 10,
            backgroundColor: "#FFFFFF",
            borderRadius: 6,
            borderWidth: 1,
            borderColor: palette.divider,
            borderStyle: "solid",
          }}
        >
          <Image src={qr} style={{ width: 132, height: 132 }} />
        </View>

        <Text style={{ fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: palette.accent, marginTop: 16 }}>
          Scan for more information
        </Text>
        <Text style={{ fontSize: 8, color: palette.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 1.4 }}>
          Reference information only. Not a verification of authenticity.
        </Text>

        {/* Footer wordmark */}
        <View style={{ position: "absolute", bottom: 18, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ fontSize: 7, letterSpacing: 1.5, textTransform: "uppercase", color: palette.textSecondary }}>
            Powered by Tagit
          </Text>
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
