import { Resend } from "resend";
import { formatNaira } from "@/lib/billing/pricing";

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

  <!-- header banner -->
  <tr><td style="padding:0 0 18px">
    <img src="${APP_URL}/email-header.png" width="480" alt="Tagit — The Identification Infrastructure of Luxury" style="display:block;width:100%;max-width:480px;height:auto;border:0" />
  </td></tr>

  <!-- card -->
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid ${LINE};border-radius:14px;overflow:hidden">
      <tr><td height="3" style="background:${GOLD};font-size:0;line-height:3px">&nbsp;</td></tr>
      <tr><td style="padding:38px 38px 34px">${content}</td></tr>
    </table>
  </td></tr>

  <!-- footer (tagline lives in the header banner now) -->
  <tr><td style="padding:26px 8px 0;text-align:center">
    <p style="margin:0;font-family:${SANS};font-size:11px;color:#BFBAAE">© ${new Date().getFullYear()} Tagit · <a href="mailto:info@tagitlux.com" style="color:#BFBAAE;text-decoration:none">info@tagitlux.com</a></p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// Representative email rendered to HTML for visual preview (no send). Shows the
// shared header banner + card. Used by the staging-only /dev/email-preview route.
export function previewEmailHtml(): string {
  return base(
    `
    ${eyebrow("Ownership Transfer")}
    ${heading("An item is being transferred to you")}
    ${para(`Hi Amara, <strong style="color:${INK};font-weight:600">Studio Noir</strong> is transferring ownership of <strong style="color:${INK};font-weight:600">The Midnight Tote</strong> to you on Tagit.`)}
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0 24px">
      ${keyVal("Item", "The Midnight Tote")}
      ${keyVal("From", "Studio Noir")}
      ${keyVal("Sale price", "NGN 250,000")}
    </table>
    ${para("Accept to become the verified owner and receive your certificate. This link expires in 24 hours.")}
    ${button("Accept ownership", "#")}
  `,
    { preheader: "Sample email — header & layout preview" }
  );
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

// Escape user-controlled text before interpolating into email HTML. Names and
// emails reach external inboxes (e.g. a claimant's name in the brand's
// notification), so a value like `<a href="evil">` must not inject markup.
function esc(v: string | null | undefined): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function keyVal(label: string, value: string, mono = false) {
  // `mono` renders long machine strings (e.g. payment references) in a smaller
  // monospace with forced wrapping so they hug the cell instead of overflowing
  // the email body on narrow mobile widths.
  const valueStyle = mono
    ? `font-family:${MONO};font-size:11px;word-break:break-all;line-height:1.5`
    : `font-family:${SANS};font-size:14px`;
  return `<tr>
    <td style="padding:11px 16px 11px 0;border-top:1px solid ${LINE};font-family:${MONO};font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTE};vertical-align:top;white-space:nowrap">${label}</td>
    <td style="padding:11px 0;border-top:1px solid ${LINE};${valueStyle};color:${INK};font-weight:500;text-align:right;vertical-align:top">${esc(value)}</td>
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
    ${para(`Congratulations, ${esc(opts.claimantName)}. Your ownership of <strong style="color:${INK};font-weight:600">${esc(opts.productName)}</strong> by ${esc(opts.companyName)} has been verified and recorded on Tagit.`)}
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
    ${para(`Hi ${esc(opts.claimantName)}, your ownership claim for <strong style="color:${INK};font-weight:600">${esc(opts.productName)}</strong> was not approved.`)}
    ${opts.reason ? `<table role="presentation" width="100%" style="margin:18px 0"><tr><td style="padding:14px 18px;background:${PAPER};border-left:2px solid ${GOLD};border-radius:0 8px 8px 0"><p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${BODY}">${esc(opts.reason)}</p></td></tr></table>` : ""}
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
    ${para(`Hi ${esc(opts.recipientName)}, <strong style="color:${INK};font-weight:600">${esc(opts.fromName)}</strong> is transferring ownership of <strong style="color:${INK};font-weight:600">${esc(opts.productName)}</strong> by ${esc(opts.companyName)} to you on Tagit.`)}
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
      ? para(`You are now the verified owner of <strong style="color:${INK};font-weight:600">${esc(opts.productName)}</strong> on Tagit. Your ownership is recorded on the permanent provenance ledger.`)
      : para(`Ownership of <strong style="color:${INK};font-weight:600">${esc(opts.productName)}</strong> has been successfully transferred. Your stewardship now lives on as part of its provenance.`)}
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

  const greeting = opts.ownerName ? `Hi ${esc(opts.ownerName)},` : "Hi,";

  const html = base(`
    ${eyebrow("Authentication Chip")}
    ${heading("Your item’s chip has been replaced")}
    ${para(greeting)}
    ${para(`<strong style="color:${INK};font-weight:600">${esc(opts.brandName)}</strong> has replaced the authentication chip on your item. Your ownership record is fully intact and unaffected.`)}
    ${para(`If you did not expect this, contact <a href="mailto:info@tagitlux.com" style="color:${INK}">info@tagitlux.com</a>.`)}
  `);

  const text = `${greeting}\n\n${opts.brandName} has replaced the authentication chip on your item. Your ownership record is unaffected.\n\nIf you did not expect this contact info@tagitlux.com\n\nTagit`;

  await resend.emails.send({ from: FROM, to, replyTo: "info@tagitlux.com", subject, html, text });
}

export async function sendInquiryReceivedEmail(
  to: string,
  opts: { name: string; company: string }
) {
  const firstName = opts.name.split(" ")[0];

  const html = base(
    `
    ${eyebrow("Application Received")}
    ${heading("Your request is being reviewed")}
    ${para(`Thank you for your interest in Tagit, ${esc(firstName)}. We have received your request to bring <strong style="color:${INK};font-weight:600">${esc(opts.company)}</strong> onto the platform.`)}
    ${para("Tagit is the identity layer for the world’s finest physical goods. Every piece a house creates gains a permanent, verifiable identity that travels with it forever, through every owner, for the life of the object.")}
    ${para("Access is considered, and every brand is reviewed personally. We will be in touch within 48 hours with your next step.")}
    <table role="presentation" width="100%" style="margin:22px 0 4px"><tr><td style="padding:16px 18px;background:${PAPER};border:1px solid ${LINE};border-radius:10px">
      <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${GOLD}">What happens next</p>
      <p style="margin:8px 0 0;font-family:${SANS};font-size:14px;line-height:1.6;color:${BODY}">We review your brand, then send a private invitation to set up your account. You will be among a small, considered group of houses building the future of provenance.</p>
    </td></tr></table>
    <p style="margin:22px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTE}">Any questions in the meantime? Simply reply to this email.</p>
  `,
    { preheader: "Your request to join Tagit is being reviewed. We will be in touch within 48 hours." }
  );

  const text = `Hi ${firstName},\n\nThank you for your interest in Tagit. We have received your request to bring ${opts.company} onto the platform.\n\nTagit is the identity layer for the world's finest physical goods. Every piece a house creates gains a permanent, verifiable identity that travels with it forever, through every owner, for the life of the object.\n\nAccess is considered, and every brand is reviewed personally. We will be in touch within 48 hours with your next step.\n\nAny questions in the meantime? Simply reply to this email.\n\nTagit`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: "business@tagitlux.com",
    subject: "We’ve received your request to join Tagit",
    html,
    text,
  });
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
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">I'm Fawaz, founder of Tagit. I personally reviewed your application and I'm glad to let you know that <strong>${esc(opts.companyName)}</strong> has been approved.</p>
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
    ${para(`Thank you for applying to join Tagit, ${esc(opts.companyName)}.`)}
    ${para("After reviewing your application, we’re unable to approve your account at this time.")}
    ${opts.reason ? `<table role="presentation" width="100%" style="margin:18px 0"><tr><td style="padding:14px 18px;background:${PAPER};border-left:2px solid ${GOLD};border-radius:0 8px 8px 0"><p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${BODY}">${esc(opts.reason)}</p></td></tr></table>` : ""}
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

  const html = base(
    `
    ${eyebrow("Welcome to Tagit")}
    ${heading(`Welcome, ${esc(opts.company)}`)}
    ${para(`${esc(firstName)}, I’m Fawaz, founder of Tagit. I reviewed your application personally, and it is my pleasure to welcome you in.`)}
    ${para("You are joining a small, considered group of houses building something rare: a permanent identity for every piece they create. From today, your products can carry proof of their origin, their craftsmanship, and their ownership, verifiable by anyone, for the life of the object.")}
    ${para("Your dashboard is ready. Register your first products, assign their Tagit identities, and begin building provenance for your brand.")}
    ${button("Enter your dashboard", opts.loginUrl)}
    <p style="margin:18px 0 0;font-family:${SANS};font-size:13px;color:${MUTE}">Or sign in at <a href="${opts.loginUrl}" style="color:${INK}">${opts.loginUrl}</a></p>

    <table role="presentation" width="100%" style="margin:30px 0 0"><tr><td style="border-top:1px solid ${LINE};padding-top:24px">
      <p style="margin:0 0 4px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK}">We are honored to have you.</p>
      <p style="margin:14px 0 2px;font-family:${SERIF};font-style:italic;font-size:19px;color:${INK}">Fawaz Ibrahim</p>
      <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTE}">Founder, Tagit</p>
      <p style="margin:16px 0 0;font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTE}">Reply to this note anytime. I read every one.</p>
    </td></tr></table>
  `,
    { preheader: `Welcome to Tagit, ${opts.company}. Your dashboard is ready.` }
  );

  const text = `${firstName}, I'm Fawaz, founder of Tagit. I reviewed your application personally, and it is my pleasure to welcome you in.\n\nYou are joining a small, considered group of houses building something rare: a permanent identity for every piece they create. From today, your products can carry proof of their origin, their craftsmanship, and their ownership, verifiable by anyone, for the life of the object.\n\nYour dashboard is ready. Register your first products, assign their Tagit identities, and begin building provenance for your brand.\n\nEnter your dashboard:\n${opts.loginUrl}\n\nWe are honored to have you.\n\nFawaz Ibrahim\nFounder, Tagit\n\nReply to this note anytime. I read every one.`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: "info@tagitlux.com",
    subject: `Welcome to Tagit, ${opts.company}`,
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

// ═══════════════════════════════════════════════════════════════════════════
// BILLING EMAILS
// ═══════════════════════════════════════════════════════════════════════════

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface InvoiceEmailOpts {
  companyName: string;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  discountPercentage: number | null;
  amount: number;
  dueDate: string;
  payUrl: string | null;
  paid: boolean;
  lineItems: { description: string; total: number }[];
  pdf?: Buffer;
}

// Build the optional PDF attachment array for an invoice email.
function invoiceAttachments(opts: InvoiceEmailOpts) {
  return opts.pdf
    ? [{ filename: `tagit-invoice-${opts.invoiceNumber}.pdf`, content: opts.pdf }]
    : undefined;
}

// Renders the line items, totals and (when unpaid) the Pay Now button.
function invoiceTable(opts: InvoiceEmailOpts): string {
  const rows = opts.lineItems
    .filter((i) => i.total >= 0) // discount shown separately below
    .map(
      (i) => `<tr>
        <td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${INK};vertical-align:top">${i.description}</td>
        <td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${INK};font-weight:500;text-align:right;vertical-align:top">${formatNaira(i.total)}</td>
      </tr>`
    )
    .join("");

  const discountRow =
    opts.discountAmount > 0
      ? `<tr>
          <td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${GOLD};vertical-align:top">Discount${opts.discountPercentage ? ` (${opts.discountPercentage}% off)` : ""}</td>
          <td style="padding:11px 0;border-top:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${GOLD};font-weight:500;text-align:right;vertical-align:top">−${formatNaira(opts.discountAmount)}</td>
        </tr>`
      : "";

  const totalRow = `<tr>
      <td style="padding:13px 0 0;border-top:2px solid ${INK};font-family:${MONO};font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${INK};font-weight:600;vertical-align:top">Total</td>
      <td style="padding:13px 0 0;border-top:2px solid ${INK};font-family:${SANS};font-size:18px;color:${INK};font-weight:700;text-align:right;vertical-align:top">${formatNaira(opts.amount)}</td>
    </tr>`;

  const paidBadge = opts.paid
    ? `<table role="presentation" width="100%" style="margin:18px 0 0"><tr><td align="center" style="padding:12px;background:#DCFCE7;border-radius:8px;font-family:${MONO};font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#166534;font-weight:600">● Paid</td></tr></table>`
    : opts.payUrl
    ? button(`Pay ${formatNaira(opts.amount)} now`, opts.payUrl)
    : "";

  return `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:8px 0 8px">
      ${rows}
      ${discountRow}
      ${totalRow}
    </table>
    ${paidBadge}`;
}

export async function sendTrialWelcomeEmail(
  to: string,
  opts: { companyName: string; planName: string; trialDays: number; trialEndsAt: string; firstInvoiceAmount: number; dashboardUrl: string }
) {
  const html = base(
    `
    ${eyebrow("Welcome to Tagit")}
    ${heading(`Your ${opts.trialDays}-day trial has started`)}
    ${para(`Welcome, ${opts.companyName}. Your <strong style="color:${INK};font-weight:600">${opts.planName}</strong> plan is live and your trial runs until <strong style="color:${INK};font-weight:600">${fmtDate(opts.trialEndsAt)}</strong>.`)}
    ${para(`Explore everything your plan offers. When your trial ends, your first invoice of <strong style="color:${INK};font-weight:600">${formatNaira(opts.firstInvoiceAmount)}</strong> will be issued automatically with a secure payment link.`)}
    ${button("Open your dashboard", opts.dashboardUrl)}
  `,
    { preheader: `Your Tagit ${opts.trialDays}-day trial has started.` }
  );
  await resend.emails.send({ from: FROM, to, subject: `Welcome to Tagit — your ${opts.trialDays}-day trial has started`, html });
}

export async function sendTrialEnding7Email(
  to: string,
  opts: { companyName: string; trialEndsAt: string; firstInvoiceAmount: number; payUrl?: string | null }
) {
  const html = base(
    `
    ${eyebrow("Trial Reminder")}
    ${heading("Your trial ends in 7 days")}
    ${para(`Hi ${opts.companyName}, your Tagit trial ends on <strong style="color:${INK};font-weight:600">${fmtDate(opts.trialEndsAt)}</strong>.`)}
    ${para(`Your first invoice of <strong style="color:${INK};font-weight:600">${formatNaira(opts.firstInvoiceAmount)}</strong> will be issued then. No action is needed today.`)}
    ${opts.payUrl ? button("Review billing", opts.payUrl) : ""}
  `,
    { preheader: "Your Tagit trial ends in 7 days." }
  );
  await resend.emails.send({ from: FROM, to, subject: "Your Tagit trial ends in 7 days", html });
}

export async function sendTrialEndingTomorrowEmail(
  to: string,
  opts: { companyName: string; trialEndsAt: string; firstInvoiceAmount: number; payUrl?: string | null }
) {
  const html = base(
    `
    ${eyebrow("Trial Reminder")}
    ${heading("Your trial ends tomorrow")}
    ${para(`Hi ${opts.companyName}, your Tagit trial ends tomorrow, <strong style="color:${INK};font-weight:600">${fmtDate(opts.trialEndsAt)}</strong>.`)}
    ${para(`Your first invoice of <strong style="color:${INK};font-weight:600">${formatNaira(opts.firstInvoiceAmount)}</strong> will be issued to keep your dashboard active.`)}
    ${opts.payUrl ? button(`Pay ${formatNaira(opts.firstInvoiceAmount)} now`, opts.payUrl) : ""}
  `,
    { preheader: "Your Tagit trial ends tomorrow." }
  );
  await resend.emails.send({ from: FROM, to, subject: "Your Tagit trial ends tomorrow", html });
}

export async function sendTrialEndedInvoiceEmail(to: string, opts: InvoiceEmailOpts) {
  const html = base(
    `
    ${eyebrow("Trial Ended")}
    ${heading("Your trial has ended — invoice enclosed")}
    ${para(`Your trial period is complete. Here is your first invoice (${opts.invoiceNumber}). Pay below to keep your dashboard active.`)}
    ${invoiceTable(opts)}
    <p style="margin:20px 0 0;font-family:${SANS};font-size:13px;color:${MUTE}">Due ${fmtDate(opts.dueDate)}.</p>
  `,
    { preheader: "Your Tagit trial has ended. Your first invoice is enclosed." }
  );
  await resend.emails.send({ from: FROM, to, subject: "Your Tagit trial has ended — invoice enclosed", html, attachments: invoiceAttachments(opts) });
}

export async function sendSubscriptionInvoiceEmail(
  to: string,
  opts: InvoiceEmailOpts & { periodStart: string | null; periodEnd: string | null }
) {
  const period = opts.periodStart && opts.periodEnd ? `${fmtDate(opts.periodStart)} — ${fmtDate(opts.periodEnd)}` : "";
  const html = base(
    `
    ${eyebrow(`Invoice ${opts.invoiceNumber}`)}
    ${heading(opts.paid ? "Invoice — paid" : "Your Tagit invoice")}
    ${para(`${opts.companyName}, here is your subscription invoice${period ? ` for <strong style="color:${INK};font-weight:600">${period}</strong>` : ""}.`)}
    ${invoiceTable(opts)}
    <p style="margin:20px 0 0;font-family:${SANS};font-size:13px;color:${MUTE}">${opts.paid ? "Thank you for your payment." : `Due ${fmtDate(opts.dueDate)}.`}</p>
  `,
    { preheader: `Your Tagit invoice — ${formatNaira(opts.amount)}` }
  );
  await resend.emails.send({ from: FROM, to, subject: `Your Tagit invoice ${opts.invoiceNumber}`, html, attachments: invoiceAttachments(opts) });
}

// First-time plan activation. Sent when an admin places a brand on a plan with
// no trial: it welcomes them, states the plan they've been set up on, and
// encloses the first invoice that must be paid to activate the account. Framed
// as an onboarding moment, not a routine recurring invoice.
export async function sendPlanActivationEmail(
  to: string,
  opts: InvoiceEmailOpts & { planName: string; interval: string; periodStart: string | null; periodEnd: string | null }
) {
  const intervalLabel = opts.interval.charAt(0).toUpperCase() + opts.interval.slice(1);
  const period = opts.periodStart && opts.periodEnd ? `${fmtDate(opts.periodStart)} — ${fmtDate(opts.periodEnd)}` : "";
  const html = base(
    `
    ${eyebrow("Welcome to Tagit")}
    ${heading(`You're set up on the ${esc(opts.planName)} plan`)}
    ${para(`${opts.companyName}, the Tagit team has placed your brand on the <strong style="color:${INK};font-weight:600">${esc(opts.planName)}</strong> plan. To activate your account, please settle your first invoice below.`)}
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0 8px">
      ${keyVal("Plan", opts.planName)}
      ${keyVal("Billing", intervalLabel)}
      ${period ? keyVal("First period", period) : ""}
    </table>
    ${invoiceTable(opts)}
    ${para(`Once this invoice is paid, your <strong style="color:${INK};font-weight:600">${esc(opts.planName)}</strong> plan is active and you can begin ordering chips. Until then, your account is awaiting payment.`)}
    <p style="margin:20px 0 0;font-family:${SANS};font-size:13px;color:${MUTE}">Due ${fmtDate(opts.dueDate)}. A PDF copy of this invoice is attached.</p>
  `,
    { preheader: `Welcome to Tagit — you've been set up on the ${opts.planName} plan.` }
  );
  await resend.emails.send({ from: FROM, to, subject: `Welcome to Tagit — your ${opts.planName} plan`, html, attachments: invoiceAttachments(opts) });
}

export async function sendBatchInvoiceEmail(to: string, opts: InvoiceEmailOpts) {
  const html = base(
    `
    ${eyebrow(`Invoice ${opts.invoiceNumber}`)}
    ${heading("Invoice for your chip order")}
    ${para(`${opts.companyName}, here is the invoice for your chip order. Your batch will be produced and dispatched once payment is received.`)}
    ${invoiceTable(opts)}
    <p style="margin:20px 0 0;font-family:${SANS};font-size:13px;color:${MUTE}">Please pay by ${fmtDate(opts.dueDate)} so we can ship your chips.</p>
  `,
    { preheader: `Invoice for your chip order — ${formatNaira(opts.amount)}` }
  );
  await resend.emails.send({ from: FROM, to, subject: `Invoice for your chip order — ${opts.invoiceNumber}`, html, attachments: invoiceAttachments(opts) });
}

// Payment receipt — sent when an invoice is settled. Doubles as the brand's
// receipt for their records: receipt number, paid date, reference, line items,
// totals and a PAID badge.
export async function sendPaymentConfirmedEmail(
  to: string,
  opts: {
    companyName: string;
    amount: number;
    invoiceNumber: string;
    type: "subscription" | "batch";
    periodLabel?: string;
    paidAt: string;
    reference: string | null;
    lineItems: { description: string; total: number }[];
    subtotal: number;
    discountAmount: number;
    discountPercentage: number | null;
  }
) {
  const what =
    opts.type === "batch"
      ? "Your chip order is now approved and will be processed."
      : opts.periodLabel
      ? `Your subscription is active for ${opts.periodLabel}.`
      : "Your subscription is active.";

  const html = base(
    `
    ${eyebrow("Receipt")}
    ${heading("Payment received")}

    <table role="presentation" width="100%" style="margin:0 0 20px"><tr>
      <td align="center" style="padding:12px;background:#DCFCE7;border-radius:8px;font-family:${MONO};font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#166534;font-weight:700">● Paid</td>
    </tr></table>

    ${para(`Thank you, ${opts.companyName}. We have received your payment of <strong style="color:${INK};font-weight:600">${formatNaira(opts.amount)}</strong>.`)}

    <table role="presentation" style="width:100%;border-collapse:collapse;margin:18px 0 6px">
      ${keyVal("Receipt no.", opts.invoiceNumber)}
      ${keyVal("Paid on", fmtDate(opts.paidAt))}
      ${opts.reference ? keyVal("Reference", opts.reference, true) : ""}
    </table>

    ${invoiceTable({
      companyName: opts.companyName,
      invoiceNumber: opts.invoiceNumber,
      subtotal: opts.subtotal,
      discountAmount: opts.discountAmount,
      discountPercentage: opts.discountPercentage,
      amount: opts.amount,
      dueDate: opts.paidAt,
      payUrl: null,
      paid: false, // prominent PAID badge is shown above; avoid a duplicate here
      lineItems: opts.lineItems,
    })}

    ${para(`<span style="font-size:13px;color:${MUTE}">${what}</span>`)}
  `,
    { preheader: `Payment received — ${formatNaira(opts.amount)}` }
  );
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment Received — Receipt #${opts.invoiceNumber}`,
    html,
  });
}

export async function sendDiscountAppliedEmail(
  to: string,
  opts: { companyName: string; percentage: number; duration: number; type: "subscription" | "batch" }
) {
  const unit = opts.type === "subscription" ? "billing cycles" : "chip orders";
  const html = base(
    `
    ${eyebrow("A Discount For You")}
    ${heading("You have a discount on your account")}
    ${para(`Good news, ${opts.companyName}. We have applied a <strong style="color:${INK};font-weight:600">${opts.percentage}% discount</strong> to your account for the next <strong style="color:${INK};font-weight:600">${opts.duration} ${unit}</strong>.`)}
    ${para(`It starts from your next ${opts.type === "subscription" ? "invoice" : "chip order"} and will be shown clearly on every invoice during the discount period.`)}
  `,
    { preheader: `You have a ${opts.percentage}% discount on your Tagit account.` }
  );
  await resend.emails.send({ from: FROM, to, subject: "Good news — you have a discount on your Tagit account", html });
}

// Delinquency reminders — day 3, 7 and 14.
export async function sendInvoiceReminderEmail(
  to: string,
  opts: { companyName: string; invoiceNumber: string; amount: number; daysOverdue: number; payUrl: string | null; finalWarning: boolean }
) {
  const html = base(
    `
    ${eyebrow(opts.finalWarning ? "Final Notice" : "Payment Reminder")}
    ${heading(opts.finalWarning ? "Final notice — action required" : "Your invoice is overdue")}
    ${para(`${opts.companyName}, invoice ${opts.invoiceNumber} for <strong style="color:${INK};font-weight:600">${formatNaira(opts.amount)}</strong> is now ${opts.daysOverdue} days overdue.`)}
    ${para(opts.finalWarning ? "If this invoice is not settled, your dashboard access will be suspended. Your customers can always verify their items — only your dashboard is affected." : "Please settle it to keep your account in good standing.")}
    ${opts.payUrl ? button(`Pay ${formatNaira(opts.amount)} now`, opts.payUrl) : ""}
  `,
    { preheader: `Invoice ${opts.invoiceNumber} is ${opts.daysOverdue} days overdue.` }
  );
  await resend.emails.send({ from: FROM, to, subject: opts.finalWarning ? `Final notice — invoice ${opts.invoiceNumber} overdue` : `Reminder — invoice ${opts.invoiceNumber} overdue`, html });
}

export async function sendAccountSuspendedEmail(
  to: string,
  opts: { companyName: string; invoiceNumber: string; amount: number; payUrl: string | null }
) {
  const html = base(
    `
    ${eyebrow("Account Suspended")}
    ${heading("Your dashboard access is suspended")}
    ${para(`${opts.companyName}, because invoice ${opts.invoiceNumber} for <strong style="color:${INK};font-weight:600">${formatNaira(opts.amount)}</strong> remains unpaid, your dashboard access has been suspended.`)}
    ${para("Pay your outstanding balance to restore access immediately. Your customers can still verify their items at any time — chip scanning is never affected.")}
    ${opts.payUrl ? button(`Pay ${formatNaira(opts.amount)} now`, opts.payUrl) : ""}
  `,
    { preheader: "Your Tagit dashboard access is suspended." }
  );
  await resend.emails.send({ from: FROM, to, subject: "Your Tagit account is suspended", html });
}

export { APP_URL };
