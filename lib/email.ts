import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Tagit <info@tagitlux.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ── Design tokens ────────────────────────────────────────────────────────────
// Mirrors the scan/certificate pages so email feels like the product, not a
// generic transactional template. Serif (Instrument Serif) renders in Apple
// Mail and degrades to Georgia elsewhere; both read as luxury, neither as SaaS.
const INK = "#0A0A0B";
const PAPER = "#FAFAF8";
const LINE = "#E8E2D5";
const GOLD = "#B8945D";
const BODY = "#55555B";
const MUTE = "#9E9EA3";
const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
const MONO = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif";

// Hidden inbox-preview line that controls the grey snippet shown next to the subject.
function preheader(text: string) {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;height:0;width:0">${text}</div>`;
}

function base(content: string, opts: { preheader?: string } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:${PAPER}">
${opts.preheader ? preheader(opts.preheader) : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER}">
<tr><td align="center" style="padding:48px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">

  <!-- wordmark -->
  <tr><td style="padding:0 6px 22px">
    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${GOLD};vertical-align:middle;margin-right:8px"></span>
    <span style="font-family:${SERIF};font-style:italic;font-size:25px;color:${INK};letter-spacing:-0.02em;vertical-align:middle">Tagit</span>
  </td></tr>

  <!-- card -->
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;overflow:hidden">
      <tr><td height="3" style="background:${GOLD};font-size:0;line-height:3px">&nbsp;</td></tr>
      <tr><td style="padding:38px 38px 34px">${content}</td></tr>
    </table>
  </td></tr>

  <!-- footer -->
  <tr><td style="padding:26px 8px 0;text-align:center">
    <p style="margin:0 0 7px;font-family:${MONO};font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#BFBAAE">Identity Infrastructure for Physical Luxury</p>
    <p style="margin:0;font-family:${SANS};font-size:11px;color:#BFBAAE">© ${new Date().getFullYear()} Tagit · <a href="mailto:info@tagitlux.com" style="color:#BFBAAE;text-decoration:none">info@tagitlux.com</a></p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// Mono uppercase gold label: the editorial "eyebrow" above a headline.
function eyebrow(text: string) {
  return `<p style="margin:0 0 14px;font-family:${MONO};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${GOLD}">${text}</p>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 18px;font-family:${SERIF};font-style:italic;font-weight:400;font-size:30px;line-height:1.12;letter-spacing:-0.02em;color:${INK}">${text}</h1>`;
}

function para(text: string) {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.7;color:${BODY}">${text}</p>`;
}

// Bulletproof-ish button: table cell carries the fill so it survives Outlook.
function button(text: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 2px"><tr>
    <td style="border-radius:8px;background:${INK}">
      <a href="${url}" style="display:inline-block;padding:14px 30px;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${PAPER};text-decoration:none;border-radius:8px">${text}</a>
    </td>
  </tr></table>`;
}

function keyVal(label: string, value: string) {
  return `<tr>
    <td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${MONO};font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTE};vertical-align:top">${label}</td>
    <td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${INK};font-weight:500;text-align:right;vertical-align:top">${value}</td>
  </tr>`;
}

export async function sendOtpEmail(to: string, code: string, purpose: "claim" | "transfer") {
  // The code is deliberately NOT in the subject. A code in the subject line is
  // exposed in lock-screen / notification previews (shoulder-surfing) and in
  // any system that logs subjects. Keep it inside the body only.
  const subject = "Your Tagit verification code";

  const action =
    purpose === "claim"
      ? "confirm your email and submit your ownership claim"
      : "confirm your identity and continue the ownership transfer";

  const html = base(
    `
    ${eyebrow("Verification")}
    ${heading("Confirm it’s you")}
    ${para(`Enter this code to ${action}.`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
      <tr><td align="center" style="padding:22px;background:${PAPER};border:1px solid ${LINE};border-radius:12px">
        <div style="font-family:${MONO};font-size:34px;font-weight:600;letter-spacing:0.34em;color:${INK};padding-left:0.34em">${code}</div>
        <div style="margin-top:10px;font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTE}">Expires in 10 minutes</div>
      </td></tr>
    </table>

    ${para(`<span style="font-size:13px;color:${MUTE}">For your security, Tagit will never ask you for this code. If you didn’t request it, you can safely ignore this email.</span>`)}
  `,
    { preheader: "Your one-time verification code. Expires in 10 minutes." }
  );

  const text = `Confirm it's you\n\nEnter this code to ${action}:\n\n${code}\n\nThis code expires in 10 minutes. For your security, Tagit will never ask you for this code. If you didn't request it, you can safely ignore this email.\n\nTagit`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}

export async function sendClaimNotificationEmail(
  to: string,
  opts: {
    companyName: string;
    productName: string;
    claimantName: string;
    claimantEmail: string;
    claimUrl: string;
  }
) {
  const html = base(`
    ${eyebrow("Ownership Claim")}
    ${heading("A new claim awaits your review")}
    ${para(`A verified ownership claim has been submitted for one of your pieces on Tagit.`)}
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0 24px">
      ${keyVal("Product", opts.productName)}
      ${keyVal("Claimant", opts.claimantName)}
      ${keyVal("Email", opts.claimantEmail)}
    </table>
    ${button("Review claim", opts.claimUrl)}
    <p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTE}">You have 7 days to approve or reject this claim before it expires.</p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New ownership claim for ${opts.productName}`,
    html,
  });
}

export async function sendClaimApprovedEmail(
  to: string,
  opts: {
    claimantName: string;
    productName: string;
    companyName: string;
    tagUrl: string;
  }
) {
  const html = base(`
    ${eyebrow("Ownership Confirmed")}
    ${heading("The piece is yours")}
    ${para(`Congratulations, ${opts.claimantName}. Your ownership of <strong style="color:${INK};font-weight:600">${opts.productName}</strong> by ${opts.companyName} has been verified and recorded on Tagit.`)}
    ${para("It now forms part of the permanent provenance record for this item, a history that travels with it forever.")}
    ${button("View your item", opts.tagUrl)}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ownership of ${opts.productName} is confirmed`,
    html,
  });
}

export async function sendClaimRejectedEmail(
  to: string,
  opts: {
    claimantName: string;
    productName: string;
    reason?: string;
  }
) {
  const html = base(`
    ${eyebrow("Claim Update")}
    ${heading("Your claim wasn’t approved")}
    ${para(`Hi ${opts.claimantName}, your ownership claim for <strong style="color:${INK};font-weight:600">${opts.productName}</strong> was not approved.`)}
    ${opts.reason ? `<table role="presentation" width="100%" style="margin:18px 0"><tr><td style="padding:14px 18px;background:${PAPER};border-left:2px solid ${GOLD};border-radius:0 8px 8px 0"><p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${BODY}">${opts.reason}</p></td></tr></table>` : ""}
    ${para("If you believe this is an error, please contact the brand directly.")}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `An update on your claim for ${opts.productName}`,
    html,
  });
}

export async function sendTransferAcceptanceEmail(
  to: string,
  opts: {
    recipientName: string;
    productName: string;
    fromName: string;
    companyName: string;
    acceptanceUrl: string;
    salePrice?: number;
    currency?: string;
  }
) {
  const priceText = opts.salePrice
    ? `${opts.currency || "NGN"} ${opts.salePrice.toLocaleString()}`
    : "";

  const subject = `${opts.fromName} is transferring ${opts.productName} to you`;

  const html = base(
    `
    ${eyebrow("Ownership Transfer")}
    ${heading("An item is being transferred to you")}
    ${para(`Hi ${opts.recipientName}, <strong style="color:${INK};font-weight:600">${opts.fromName}</strong> is transferring ownership of <strong style="color:${INK};font-weight:600">${opts.productName}</strong> by ${opts.companyName} to you on Tagit.`)}
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0 24px">
      ${keyVal("Item", opts.productName)}
      ${keyVal("From", opts.fromName)}
      ${priceText ? keyVal("Sale price", priceText) : ""}
    </table>
    ${para("Accept to become the verified owner and receive your certificate. This link expires in 24 hours.")}
    ${button("Accept ownership", opts.acceptanceUrl)}
    <p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTE}">If you weren’t expecting this, you can ignore this email. The transfer will expire automatically.</p>
  `,
    { preheader: `${opts.fromName} is transferring ${opts.productName} to you. Accept within 24 hours.` }
  );

  const text = `Hi ${opts.recipientName},\n\n${opts.fromName} is transferring ownership of ${opts.productName} by ${opts.companyName} to you on Tagit.\n\nItem: ${opts.productName}\nFrom: ${opts.fromName}${priceText ? `\nSale price: ${priceText}` : ""}\n\nAccept ownership here (expires in 24 hours):\n${opts.acceptanceUrl}\n\nIf you weren't expecting this, ignore this email.\n\nTagit`;

  await resend.emails.send({ from: FROM, to, subject, html, text });
}

export async function sendTransferCompleteEmail(
  to: string,
  opts: {
    name: string;
    productName: string;
    tagUrl: string;
    role: "sender" | "recipient";
  }
) {
  const html = base(`
    ${eyebrow("Transfer Complete")}
    ${heading(opts.role === "recipient" ? "Welcome, new owner" : "Transfer complete")}
    ${opts.role === "recipient"
      ? para(`You are now the verified owner of <strong style="color:${INK};font-weight:600">${opts.productName}</strong> on Tagit. Your ownership is recorded on the permanent provenance ledger.`)
      : para(`Ownership of <strong style="color:${INK};font-weight:600">${opts.productName}</strong> has been successfully transferred. Your stewardship now lives on as part of its provenance.`)}
    ${button("View item", opts.tagUrl)}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Transfer complete for ${opts.productName}`,
    html,
  });
}

export async function sendChipReplacedEmail(
  to: string,
  opts: { ownerName?: string; productName: string; brandName: string }
) {
  const subject = `Your ${opts.productName} chip has been replaced`;

  const greeting = opts.ownerName ? `Hi ${opts.ownerName},` : "Hi,";

  const html = base(`
    ${eyebrow("Authentication Chip")}
    ${heading("Your item’s chip has been replaced")}
    ${para(greeting)}
    ${para(`<strong style="color:${INK};font-weight:600">${opts.brandName}</strong> has replaced the authentication chip on your item. Your ownership record is fully intact and unaffected.`)}
    ${para(`If you did not expect this, contact <a href="mailto:info@tagitlux.com" style="color:${INK}">info@tagitlux.com</a>.`)}
  `);

  const text = `${greeting}\n\n${opts.brandName} has replaced the authentication chip on your item. Your ownership record is unaffected.\n\nIf you did not expect this contact info@tagitlux.com\n\nTagit`;

  await resend.emails.send({ from: FROM, to, replyTo: "info@tagitlux.com", subject, html, text });
}

export async function sendCompanyApprovedEmail(
  to: string,
  opts: { companyName: string; dashboardUrl: string }
) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 24px;font-family:system-ui,-apple-system,sans-serif;background:#ffffff;color:#1F1F22;max-width:560px">
  <p style="margin:0 0 20px;font-size:15px;line-height:1.6">Hi,</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">I'm Fawaz, founder of Tagit. I personally reviewed your application and I'm glad to let you know that <strong>${opts.companyName}</strong> has been approved.</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">We built Tagit because luxury goods deserve an identity layer that lasts forever, travels with every product, and gives your customers ownership records they can verify themselves.</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">You can now sign in to your dashboard, register products, assign tags, and start building provenance for your brand.</p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6">Head here to get started:</p>
  <p style="margin:0 0 8px"><a href="${opts.dashboardUrl}" style="display:inline-block;padding:11px 22px;background:#0A0A0B;color:#FAFAF8;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Go to your dashboard</a></p>
  <p style="margin:16px 0 0;font-size:13px;color:#6E6E73">Or: <a href="${opts.dashboardUrl}" style="color:#0A0A0B">${opts.dashboardUrl}</a></p>
  <p style="margin:28px 0 4px;font-size:15px;line-height:1.6;color:#1F1F22">Looking forward to having you on board.</p>
  <p style="margin:0 0 4px;font-size:14px;color:#4A4A4F">Fawaz Ibrahim</p>
  <p style="margin:0;font-size:13px;color:#9E9EA3">Founder, Tagit</p>
  <p style="margin:20px 0 0;font-size:13px;color:#B0B0B5">Reply to this email if you have any questions. I read every reply.</p>
</body>
</html>`;

  const text = `Hi,\n\nI'm Fawaz, founder of Tagit. I personally reviewed your application and I'm glad to let you know that ${opts.companyName} has been approved.\n\nWe built Tagit because luxury goods deserve an identity layer that lasts forever, travels with every product, and gives your customers ownership records they can verify themselves.\n\nYou can now sign in to your dashboard, register products, assign tags, and start building provenance for your brand.\n\nHead here to get started:\n${opts.dashboardUrl}\n\nLooking forward to having you on board.\n\nFawaz Ibrahim\nFounder, Tagit\n\nReply to this email if you have any questions. I read every reply.`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: "info@tagitlux.com",
    subject: `Your Tagit account is approved, ${opts.companyName}`,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `company-approved-${Buffer.from(to).toString("base64").slice(0, 12)}-${Date.now()}`,
    },
  });
}

export async function sendCompanyRejectedEmail(
  to: string,
  opts: { companyName: string; reason?: string }
) {
  const html = base(`
    ${eyebrow("Application Update")}
    ${heading("About your application")}
    ${para(`Thank you for applying to join Tagit, ${opts.companyName}.`)}
    ${para("After reviewing your application, we’re unable to approve your account at this time.")}
    ${opts.reason ? `<table role="presentation" width="100%" style="margin:18px 0"><tr><td style="padding:14px 18px;background:${PAPER};border-left:2px solid ${GOLD};border-radius:0 8px 8px 0"><p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${BODY}">${opts.reason}</p></td></tr></table>` : ""}
    ${para("If you believe this is a mistake or would like to reapply, please reply to this email.")}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Tagit application update",
    html,
  });
}

export async function sendBrandInvitationEmail(
  to: string,
  opts: { name: string; company: string; loginUrl: string }
) {
  const firstName = opts.name.split(" ")[0];

  // Plain, conversational HTML. No headers, no promotional elements, no unsubscribe.
  // Signed as a person rather than a brand blast. This keeps it out of Gmail Promotions.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 24px;font-family:system-ui,-apple-system,sans-serif;background:#ffffff;color:#1F1F22;max-width:560px">
  <p style="margin:0 0 20px;font-size:15px;line-height:1.6">Hi ${firstName},</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">I'm Fawaz, founder of Tagit. I personally reviewed your application and I'm glad to let you know that <strong>${opts.company}</strong> has been approved.</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">We built Tagit because luxury goods deserve an identity layer that lasts forever, travels with every product, and gives your customers ownership records they can verify themselves.</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">You can now sign in to your dashboard, register products, assign tags, and start building provenance for your brand.</p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6">Sign in here:</p>
  <p style="margin:0 0 8px"><a href="${opts.loginUrl}" style="display:inline-block;padding:11px 22px;background:#0A0A0B;color:#FAFAF8;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Sign in to Tagit</a></p>
  <p style="margin:16px 0 0;font-size:13px;color:#6E6E73">Or: <a href="${opts.loginUrl}" style="color:#0A0A0B">${opts.loginUrl}</a></p>
  <p style="margin:28px 0 4px;font-size:15px;line-height:1.6;color:#1F1F22">Looking forward to having you on board.</p>
  <p style="margin:0 0 4px;font-size:14px;color:#4A4A4F">Fawaz Ibrahim</p>
  <p style="margin:0;font-size:13px;color:#9E9EA3">Founder, Tagit</p>
  <p style="margin:20px 0 0;font-size:13px;color:#B0B0B5">Reply to this email if you have any questions. I read every reply.</p>
</body>
</html>`;

  const text = `Hi ${firstName},\n\nI'm Fawaz, founder of Tagit. I personally reviewed your application and I'm glad to let you know that ${opts.company} has been approved.\n\nWe built Tagit because luxury goods deserve an identity layer that lasts forever, travels with every product, and gives your customers ownership records they can verify themselves.\n\nYou can now sign in to your dashboard, register products, assign tags, and start building provenance for your brand.\n\nSign in here:\n${opts.loginUrl}\n\nLooking forward to having you on board.\n\nFawaz Ibrahim\nFounder, Tagit\n\nReply to this email if you have any questions. I read every reply.`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: "info@tagitlux.com",
    subject: `Your Tagit account is ready, ${firstName}`,
    html,
    text,
    headers: {
      // Unique per send so Gmail doesn't thread separate invitations together
      "X-Entity-Ref-ID": `brand-invite-${Buffer.from(to).toString("base64").slice(0, 12)}-${Date.now()}`,
    },
  });
}

export async function sendCertificateEmail(
  to: string,
  opts: {
    ownerName: string;
    productName: string;
    companyName: string;
    certNumber: string;
    certType: "ownership" | "transfer" | "provenance";
    tagUrl: string;
    pdfBuffer: Buffer;
  }
) {
  const isProvenance = opts.certType === "provenance";
  const isTransfer = opts.certType === "transfer";

  const subject = isProvenance
    ? `Your provenance record for ${opts.productName}`
    : isTransfer
    ? `Your Certificate of Transfer for ${opts.productName}`
    : `Your Certificate of Authenticity for ${opts.productName}`;

  const html = base(`
    ${eyebrow(isProvenance ? "Provenance Record" : isTransfer ? "Certificate of Transfer" : "Certificate of Authenticity")}
    ${heading(isProvenance ? "A record of your stewardship" : "Your certificate is ready")}
    ${isProvenance
      ? `${para(`${opts.ownerName}, the ownership of <strong style="color:${INK};font-weight:600">${opts.productName}</strong> has been successfully transferred.`)}
         ${para("Your provenance record is attached. It permanently confirms your previous ownership and is part of the item’s immutable history on the Tagit Ownership Ledger.")}`
      : `${para(`Congratulations, ${opts.ownerName}. Your ownership of <strong style="color:${INK};font-weight:600">${opts.productName}</strong> by ${opts.companyName} has been recorded on Tagit.`)}
         ${para("Your certificate is attached as a PDF. It is your proof of ownership, so keep it safe.")}`
    }
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0 24px">
      ${keyVal("Certificate no.", opts.certNumber)}
      ${keyVal("Item", opts.productName)}
      ${keyVal("Brand", opts.companyName)}
    </table>
    ${!isProvenance ? button("View your item", opts.tagUrl) : ""}
    <p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTE}">Scan the QR code on your certificate to verify authenticity at any time.</p>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    attachments: [
      {
        filename: `tagit-certificate-${opts.certNumber}.pdf`,
        content: opts.pdfBuffer,
      },
    ],
  });
}

export { APP_URL };
