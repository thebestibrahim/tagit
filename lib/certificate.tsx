/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image is a PDF primitive, not an HTML img */
import {
  Document,
  Page,
  Text,
  View,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { customAlphabet } from "nanoid";
import { format } from "date-fns";

// ─── Public helpers ──────────────────────────────────────────────────────────

const certIdGen = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

export function generateCertNumber(): string {
  return `TGT-${new Date().getFullYear()}-${certIdGen()}`;
}

// ─── Data contract ───────────────────────────────────────────────────────────

export type CertificateData = {
  certNumber: string;
  certId: string;
  certType: "ownership" | "transfer" | "provenance";
  ownerName: string;
  ownerEmail: string;
  productName: string;
  companyName: string;
  companyLogoDataUrl: string | null;
  companySignatureDataUrl: string | null;
  brandPrimaryColor: string;
  brandAccentColor: string;
  issuedAt: Date;
  tagShortId: string;
  verifyUrl: string;
  fromOwnerName?: string;
  transferredToName?: string;
  ownedFrom?: Date;
  ownedUntil?: Date;
  template: "classic" | "minimal" | "heritage";
};

// ─── Internal helpers ────────────────────────────────────────────────────────

async function buildQr(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 140,
    color: { dark: "#0A0A0B", light: "#FFFFFF" },
  });
}

export async function fetchLogoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const ct = res.headers.get("content-type") ?? "image/png";
    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

// ─── Shared design tokens ────────────────────────────────────────────────────

const GOLD = "#B8945D";
const ONYX = "#0A0A0B";
const PEARL = "#FAFAF8";
const CREAM = "#F5F2EC";
const SLATE = "#6E6E73";
const MIST = "#9E9EA3";
const STONE = "#E8E2D5";

// ─── TEMPLATE 1: Classic ─────────────────────────────────────────────────────
// Formal parchment feel. Gold header bar, centred seal, structured details box.

function ClassicCertificate({ data, qr }: { data: CertificateData; qr: string }) {
  const accentColor = data.brandAccentColor || GOLD;
  const isProvenance = data.certType === "provenance";
  const typeLabel = data.certType === "ownership" ? "Original Owner" : data.certType === "transfer" ? "Transfer of Ownership" : "Provenance Record";

  return (
    <Page size="A4" style={{ backgroundColor: PEARL, flexDirection: "column" }}>
      {/* Gold header bar */}
      <View
        style={{
          backgroundColor: accentColor,
          paddingVertical: 13,
          paddingHorizontal: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 7,
            color: "#FFFFFF",
            letterSpacing: 3,
          }}
        >
          {isProvenance ? "PROVENANCE RECORD" : "CERTIFICATE OF AUTHENTICITY"}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 7,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 2,
          }}
        >
          TAGIT
        </Text>
      </View>

      {/* Main content */}
      <View style={{ flex: 1, paddingHorizontal: 56, paddingTop: 36 }}>
        {/* Company logo + name */}
        {data.companyLogoDataUrl && (
          <Image
            src={data.companyLogoDataUrl}
            style={{
              width: 52,
              height: 52,
              alignSelf: "center",
              marginBottom: 10,
              objectFit: "contain",
            }}
          />
        )}
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 15,
            color: ONYX,
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          {data.companyName}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 9,
            color: MIST,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          PRESENTS
        </Text>

        {/* Gold rule */}
        <View
          style={{
            alignSelf: "center",
            width: 200,
            height: 1,
            backgroundColor: accentColor,
            marginTop: 20,
            marginBottom: 24,
          }}
        />

        {/* Ownership text */}
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 11,
            color: SLATE,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          This certifies that
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 28,
            color: ONYX,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {data.ownerName}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 11,
            color: SLATE,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {data.certType === "transfer"
            ? "has received ownership of"
            : isProvenance
            ? "was the verified owner of"
            : "is the verified original owner of"}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 21,
            color: accentColor,
            textAlign: "center",
            marginBottom: 28,
          }}
        >
          {data.productName}
        </Text>

        {/* Details box */}
        <View
          style={{
            backgroundColor: CREAM,
            borderRadius: 8,
            padding: 18,
            marginBottom: 28,
          }}
        >
          <View style={{ flexDirection: "row", marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 7,
                  color: MIST,
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                CERTIFICATE NO.
              </Text>
              <Text
                style={{
                  fontFamily: "Courier-Bold",
                  fontSize: 10,
                  color: ONYX,
                }}
              >
                {data.certNumber}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 7,
                  color: MIST,
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                DATE ISSUED
              </Text>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 10,
                  color: ONYX,
                }}
              >
                {format(data.issuedAt, "dd MMMM yyyy")}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 7,
                  color: MIST,
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                OWNERSHIP TYPE
              </Text>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 10,
                  color: ONYX,
                }}
              >
                {typeLabel}
              </Text>
            </View>
          </View>

          {isProvenance && data.ownedFrom && data.ownedUntil && (
            <View style={{ flexDirection: "row", marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.5, marginBottom: 4 }}>
                  OWNED FROM
                </Text>
                <Text style={{ fontFamily: "Helvetica", fontSize: 10, color: ONYX }}>
                  {format(data.ownedFrom, "dd MMM yyyy")}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.5, marginBottom: 4 }}>
                  TRANSFERRED ON
                </Text>
                <Text style={{ fontFamily: "Helvetica", fontSize: 10, color: ONYX }}>
                  {format(data.ownedUntil, "dd MMM yyyy")}
                </Text>
              </View>
            </View>
          )}

          <View
            style={{
              height: 1,
              backgroundColor: STONE,
              marginBottom: 14,
            }}
          />

          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 7,
                  color: MIST,
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                TAG ID
              </Text>
              <Text
                style={{
                  fontFamily: "Courier",
                  fontSize: 10,
                  color: "#4A4A4F",
                }}
              >
                {data.tagShortId}
              </Text>
            </View>
            {data.certType === "transfer" && data.fromOwnerName && (
              <View style={{ flex: 2 }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.5, marginBottom: 4 }}>
                  TRANSFERRED FROM
                </Text>
                <Text style={{ fontFamily: "Helvetica", fontSize: 10, color: "#4A4A4F" }}>
                  {data.fromOwnerName}
                </Text>
              </View>
            )}
            {isProvenance && data.transferredToName && (
              <View style={{ flex: 2 }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.5, marginBottom: 4 }}>
                  TRANSFERRED TO
                </Text>
                <Text style={{ fontFamily: "Helvetica", fontSize: 10, color: "#4A4A4F" }}>
                  {data.transferredToName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Seal ring */}
        <View
          style={{
            alignSelf: "center",
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 2,
            borderColor: accentColor,
            borderStyle: "solid",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 7,
              color: accentColor,
              letterSpacing: 2,
            }}
          >
            TAGIT
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica",
              fontSize: 5,
              color: accentColor,
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            VERIFIED
          </Text>
        </View>

        {/* Signature area */}
        <View style={{ alignSelf: "center", alignItems: "center", marginTop: 18 }}>
          {data.companySignatureDataUrl ? (
            <Image src={data.companySignatureDataUrl} style={{ width: 130, height: 42, objectFit: "contain" }} />
          ) : (
            <Text style={{ fontFamily: "Times-Italic", fontSize: 10, color: SLATE }}>
              Authorized by {data.companyName}
            </Text>
          )}
          <View style={{ width: 130, height: 0.5, backgroundColor: STONE, marginTop: 5 }} />
          <Text style={{ fontFamily: "Helvetica", fontSize: 6, color: MIST, letterSpacing: 1, marginTop: 3 }}>
            AUTHORIZED SIGNATURE
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: STONE,
          borderTopStyle: "solid",
          paddingHorizontal: 40,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 8,
              color: ONYX,
              marginBottom: 3,
            }}
          >
            Tagit — Identity Infrastructure for Luxury
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica",
              fontSize: 7,
              color: MIST,
              lineHeight: 1.5,
            }}
          >
            This document is cryptographically recorded on the Tagit Ownership Ledger.{"\n"}
            Verify at: tagit.co/certificate/{data.certId}
          </Text>
        </View>
        <Image src={qr} style={{ width: 60, height: 60 }} />
      </View>
    </Page>
  );
}

// ─── TEMPLATE 2: Minimal ──────────────────────────────────────────────────────
// White, left-aligned, clean. Left gold accent bar. Modern luxury editorial.

function MinimalCertificate({ data, qr }: { data: CertificateData; qr: string }) {
  const accentColor = data.brandAccentColor || GOLD;
  const primaryColor = data.brandPrimaryColor || ONYX;
  const isProvenance = data.certType === "provenance";
  const typeLabel = data.certType === "ownership" ? "Original Owner" : data.certType === "transfer" ? "Transfer of Ownership" : "Provenance Record";

  return (
    <Page size="A4" style={{ backgroundColor: "#FFFFFF", flexDirection: "row" }}>
      {/* Left accent bar */}
      <View style={{ width: 5, backgroundColor: accentColor }} />

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 48, paddingVertical: 48 }}>
        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 36,
          }}
        >
          {/* Company identity */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {data.companyLogoDataUrl && (
              <Image
                src={data.companyLogoDataUrl}
                style={{
                  width: 36,
                  height: 36,
                  objectFit: "contain",
                }}
              />
            )}
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 13,
                color: primaryColor,
              }}
            >
              {data.companyName}
            </Text>
          </View>

          {/* Cert label */}
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontFamily: "Helvetica",
                fontSize: 7,
                color: MIST,
                letterSpacing: 1.5,
                marginBottom: 3,
              }}
            >
              {isProvenance ? "PROVENANCE RECORD" : "CERTIFICATE OF AUTHENTICITY"}
            </Text>
            <Text
              style={{
                fontFamily: "Courier",
                fontSize: 8,
                color: SLATE,
              }}
            >
              {data.certNumber}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: STONE,
            marginBottom: 36,
          }}
        />

        {/* Product */}
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 8,
            color: accentColor,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          AUTHENTICATED ITEM
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 30,
            color: ONYX,
            lineHeight: 1.15,
            marginBottom: 6,
          }}
        >
          {data.productName}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 12,
            color: accentColor,
            marginBottom: 36,
          }}
        >
          by {data.companyName}
        </Text>

        {/* Owner block */}
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 8,
            color: MIST,
            letterSpacing: 1.5,
            marginBottom: 6,
          }}
        >
          {isProvenance ? "PREVIOUS OWNER" : "ISSUED TO"}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 22,
            color: ONYX,
            marginBottom: 3,
          }}
        >
          {data.ownerName}
        </Text>
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 10,
            color: SLATE,
            marginBottom: 32,
          }}
        >
          {data.ownerEmail}
        </Text>

        {/* Details grid */}
        <View style={{ flexDirection: "row", gap: 0 }}>
          {[
            ["DATE ISSUED", format(data.issuedAt, "dd MMM yyyy")],
            ["OWNERSHIP TYPE", typeLabel],
            ["TAG ID", data.tagShortId],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, paddingRight: 16 }}>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 7,
                  color: MIST,
                  letterSpacing: 1.2,
                  marginBottom: 4,
                }}
              >
                {label}
              </Text>
              <Text
                style={{
                  fontFamily: label === "TAG ID" ? "Courier-Bold" : "Helvetica-Bold",
                  fontSize: 9,
                  color: ONYX,
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        {data.certType === "transfer" && data.fromOwnerName && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.2, marginBottom: 4 }}>
              TRANSFERRED FROM
            </Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: ONYX }}>
              {data.fromOwnerName}
            </Text>
          </View>
        )}
        {isProvenance && (
          <View style={{ flexDirection: "row", marginTop: 12, gap: 0 }}>
            {data.ownedFrom && (
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.2, marginBottom: 4 }}>
                  OWNED FROM
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: ONYX }}>
                  {format(data.ownedFrom, "dd MMM yyyy")}
                </Text>
              </View>
            )}
            {data.ownedUntil && (
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.2, marginBottom: 4 }}>
                  TRANSFERRED ON
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: ONYX }}>
                  {format(data.ownedUntil, "dd MMM yyyy")}
                </Text>
              </View>
            )}
            {data.transferredToName && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1.2, marginBottom: 4 }}>
                  TRANSFERRED TO
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: ONYX }}>
                  {data.transferredToName}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Footer */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: STONE,
            borderTopStyle: "solid",
            paddingTop: 16,
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <View>
            {/* Signature */}
            {data.companySignatureDataUrl ? (
              <Image src={data.companySignatureDataUrl} style={{ width: 90, height: 28, objectFit: "contain", marginBottom: 4 }} />
            ) : (
              <Text style={{ fontFamily: "Times-Italic", fontSize: 8, color: SLATE, marginBottom: 4 }}>
                Authorized by {data.companyName}
              </Text>
            )}
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: 10,
                color: ONYX,
                marginBottom: 2,
              }}
            >
              Tagit
            </Text>
            <Text
              style={{
                fontFamily: "Helvetica",
                fontSize: 7,
                color: MIST,
                lineHeight: 1.5,
              }}
            >
              Recorded on the Tagit Ownership Ledger.{"\n"}
              tagit.co/certificate/{data.certId}
            </Text>
          </View>
          <Image src={qr} style={{ width: 56, height: 56 }} />
        </View>
      </View>
    </Page>
  );
}

// ─── TEMPLATE 3: Heritage ─────────────────────────────────────────────────────
// Dark brand-colour header, formal interior, decorative double-border. Premium.

function HeritageCertificate({ data, qr }: { data: CertificateData; qr: string }) {
  const primaryColor = data.brandPrimaryColor || ONYX;
  const accentColor = data.brandAccentColor || GOLD;
  const isProvenance = data.certType === "provenance";
  const typeLabel = data.certType === "ownership" ? "Original Owner" : data.certType === "transfer" ? "Transfer of Ownership" : "Provenance Record";

  return (
    <Page size="A4" style={{ backgroundColor: PEARL, flexDirection: "column" }}>
      {/* Outer border */}
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          bottom: 12,
          borderWidth: 1,
          borderColor: accentColor,
          borderStyle: "solid",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 18,
          left: 18,
          right: 18,
          bottom: 18,
          borderWidth: 1,
          borderColor: STONE,
          borderStyle: "solid",
        }}
      />

      {/* Header block */}
      <View
        style={{
          backgroundColor: primaryColor,
          paddingVertical: 26,
          paddingHorizontal: 56,
          marginHorizontal: 18,
          marginTop: 18,
          alignItems: "center",
        }}
      >
        {data.companyLogoDataUrl && (
          <Image
            src={data.companyLogoDataUrl}
            style={{
              width: 44,
              height: 44,
              objectFit: "contain",
              marginBottom: 10,
              opacity: 0.9,
            }}
          />
        )}
        <Text
          style={{
            fontFamily: "Helvetica-Bold",
            fontSize: 18,
            color: "#FFFFFF",
            textAlign: "center",
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          {data.companyName}
        </Text>
        <View
          style={{
            width: 120,
            height: 1,
            backgroundColor: accentColor,
            marginTop: 8,
          }}
        />
      </View>

      {/* Main body */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 56,
          paddingTop: 30,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Helvetica",
            fontSize: 8,
            color: MIST,
            letterSpacing: 3,
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {isProvenance ? "PROVENANCE RECORD" : "CERTIFICATE OF AUTHENTIC OWNERSHIP"}
        </Text>

        {/* Double rule */}
        <View style={{ alignItems: "center", marginBottom: 22 }}>
          <View style={{ width: 280, height: 1, backgroundColor: accentColor }} />
          <View style={{ width: 280, height: 1, backgroundColor: STONE, marginTop: 3 }} />
        </View>

        <Text
          style={{
            fontFamily: "Times-Roman",
            fontSize: 13,
            color: SLATE,
            textAlign: "center",
            marginBottom: 12,
            fontStyle: "italic",
          }}
        >
          This is to certify that
        </Text>

        <Text
          style={{
            fontFamily: "Times-Bold",
            fontSize: 30,
            color: ONYX,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {data.ownerName}
        </Text>

        <Text
          style={{
            fontFamily: "Times-Roman",
            fontSize: 12,
            color: SLATE,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {data.certType === "transfer"
            ? "has received verified ownership of the item known as"
            : isProvenance
            ? "was the verified owner of the item known as"
            : "is the rightful and verified original owner of the item known as"}
        </Text>

        <Text
          style={{
            fontFamily: "Times-BoldItalic",
            fontSize: 22,
            color: accentColor,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {data.productName}
        </Text>

        <Text
          style={{
            fontFamily: "Times-Italic",
            fontSize: 11,
            color: SLATE,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          as recorded on the Tagit Ownership Ledger
        </Text>

        {/* Double rule */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 240, height: 1, backgroundColor: STONE }} />
          <View style={{ width: 240, height: 1, backgroundColor: accentColor, marginTop: 3 }} />
        </View>

        {/* Cert details */}
        <View style={{ flexDirection: "row", gap: 0, marginBottom: 20 }}>
          {[
            ["Certificate No.", data.certNumber],
            ["Date Issued", format(data.issuedAt, "dd MMMM yyyy")],
            ["Type", typeLabel],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontSize: 7,
                  color: MIST,
                  letterSpacing: 1,
                  marginBottom: 4,
                  textAlign: "center",
                }}
              >
                {label.toUpperCase()}
              </Text>
              <Text
                style={{
                  fontFamily: label === "Certificate No." ? "Courier-Bold" : "Helvetica-Bold",
                  fontSize: 9,
                  color: ONYX,
                  textAlign: "center",
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>

        {data.certType === "transfer" && data.fromOwnerName && (
          <Text style={{ fontFamily: "Times-Italic", fontSize: 10, color: SLATE, textAlign: "center", marginBottom: 16 }}>
            Transferred from {data.fromOwnerName}
          </Text>
        )}
        {isProvenance && (
          <View style={{ flexDirection: "row", marginBottom: 16, gap: 0 }}>
            {data.ownedFrom && (
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1, marginBottom: 4, textAlign: "center" }}>
                  OWNED FROM
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: ONYX, textAlign: "center" }}>
                  {format(data.ownedFrom, "dd MMMM yyyy")}
                </Text>
              </View>
            )}
            {data.ownedUntil && (
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1, marginBottom: 4, textAlign: "center" }}>
                  TRANSFERRED ON
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: ONYX, textAlign: "center" }}>
                  {format(data.ownedUntil, "dd MMMM yyyy")}
                </Text>
              </View>
            )}
            {data.transferredToName && (
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: 7, color: MIST, letterSpacing: 1, marginBottom: 4, textAlign: "center" }}>
                  TRANSFERRED TO
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: ONYX, textAlign: "center" }}>
                  {data.transferredToName}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Signature area */}
        <View style={{ alignItems: "center", marginBottom: 14 }}>
          {data.companySignatureDataUrl ? (
            <Image src={data.companySignatureDataUrl} style={{ width: 120, height: 38, objectFit: "contain" }} />
          ) : (
            <Text style={{ fontFamily: "Times-Italic", fontSize: 10, color: SLATE }}>
              {data.companyName}
            </Text>
          )}
          <View style={{ width: 110, height: 0.5, backgroundColor: accentColor, marginTop: 5 }} />
        </View>

        {/* Heritage seal */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: primaryColor,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 7,
              color: accentColor,
              letterSpacing: 2,
            }}
          >
            TAGIT
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica",
              fontSize: 5,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: 0.5,
              marginTop: 3,
            }}
          >
            VERIFIED AUTHENTIC
          </Text>
        </View>
      </View>

      {/* Footer bar */}
      <View
        style={{
          backgroundColor: primaryColor,
          paddingVertical: 12,
          paddingHorizontal: 36,
          marginHorizontal: 18,
          marginBottom: 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 7,
              color: accentColor,
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            TAGIT
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica",
              fontSize: 7,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.5,
            }}
          >
            {data.certNumber}  |  tagit.co/certificate/{data.certId}
          </Text>
        </View>
        <Image
          src={qr}
          style={{
            width: 48,
            height: 48,
            backgroundColor: "#FFFFFF",
            padding: 2,
          }}
        />
      </View>
    </Page>
  );
}

// ─── Main document wrapper ────────────────────────────────────────────────────

function CertificateDocument({ data, qr }: { data: CertificateData; qr: string }) {
  return (
    <Document
      title={data.certType === "provenance" ? `Provenance Record — ${data.productName}` : `Certificate of Authenticity — ${data.productName}`}
      author="Tagit"
      subject={data.certType === "ownership" ? "Ownership Certificate" : data.certType === "transfer" ? "Transfer Certificate" : "Provenance Record"}
      keywords="certificate authenticity luxury tagit"
    >
      {data.template === "heritage" ? (
        <HeritageCertificate data={data} qr={qr} />
      ) : data.template === "minimal" ? (
        <MinimalCertificate data={data} qr={qr} />
      ) : (
        <ClassicCertificate data={data} qr={qr} />
      )}
    </Document>
  );
}

// ─── Public generation function ───────────────────────────────────────────────

export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  const qr = await buildQr(data.verifyUrl);
  const element = <CertificateDocument data={data} qr={qr} />;
  return renderToBuffer(element);
}
