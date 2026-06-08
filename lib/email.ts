import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Tagit <info@tagitlux.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function base(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAFAF8;font-family:system-ui,-apple-system,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="100%" style="max-width:520px;background:#fff;border:1px solid #E8E2D5;border-radius:12px;overflow:hidden">
<tr><td style="padding:32px 32px 0;background:#FAFAF8;border-bottom:1px solid #E8E2D5">
  <span style="font-size:22px;font-weight:700;color:#0A0A0B;letter-spacing:-0.02em">Tagit</span>
</td></tr>
<tr><td style="padding:32px">${content}</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #E8E2D5">
  <p style="margin:0;font-size:12px;color:#9E9EA3">© ${new Date().getFullYear()} Tagit. Identity infrastructure for luxury.</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F22;letter-spacing:-0.015em">${text}</h1>`;
}

function para(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4F">${text}</p>`;
}

function button(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;padding:12px 24px;background:#0A0A0B;color:#FAFAF8;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">${text}</a>`;
}

function keyVal(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#9E9EA3;width:40%">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#1F1F22;font-weight:500">${value}</td>
  </tr>`;
}

export async function sendOtpEmail(to: string, code: string, purpose: "claim" | "transfer") {
  const subject = `${code} is your Tagit verification code`;

  const action =
    purpose === "claim"
      ? "verify your email and submit your ownership claim"
      : "verify your identity and initiate the ownership transfer";

  // Minimal HTML — no tables, no colored blocks, no headers. Keeps it out of Promotions.
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px 24px;font-family:system-ui,-apple-system,sans-serif;background:#ffffff;color:#1F1F22">
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6">Use the code below to ${action}. It expires in 10 minutes.</p>
  <p style="margin:0 0 24px;font-size:40px;font-weight:700;letter-spacing:0.12em;font-family:monospace">${code}</p>
  <p style="margin:0;font-size:13px;color:#6E6E73">If you didn't request this, you can safely ignore this email.</p>
  <p style="margin:24px 0 0;font-size:13px;color:#9E9EA3">— Tagit</p>
</body>
</html>`;

  const text = `Your Tagit verification code: ${code}\n\nUse this code to ${action}. It expires in 10 minutes.\n\nIf you didn't request this, ignore this email.\n\n— Tagit`;

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
    ${heading("New ownership claim")}
    ${para(`A verified ownership claim has been submitted for one of your products on Tagit.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${keyVal("Product", opts.productName)}
      ${keyVal("Claimant", opts.claimantName)}
      ${keyVal("Email", opts.claimantEmail)}
    </table>
    <div style="margin:24px 0">${button("Review claim", opts.claimUrl)}</div>
    ${para('<span style="color:#9E9EA3;font-size:13px">You have 7 days to approve or reject this claim before it expires.</span>')}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `New ownership claim — ${opts.productName}`,
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
    ${heading("Ownership confirmed")}
    ${para(`Congratulations, ${opts.claimantName}. Your ownership of <strong>${opts.productName}</strong> by ${opts.companyName} has been verified and recorded on Tagit.`)}
    ${para("Your ownership is now part of the permanent provenance record for this item.")}
    <div style="margin:24px 0">${button("View your item", opts.tagUrl)}</div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Ownership confirmed — ${opts.productName}`,
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
    ${heading("Ownership claim not approved")}
    ${para(`Hi ${opts.claimantName}, your ownership claim for <strong>${opts.productName}</strong> was not approved.`)}
    ${opts.reason ? `<div style="padding:12px 16px;background:#F9DDDD;border-radius:8px;margin:16px 0"><p style="margin:0;font-size:14px;color:#B85C5C">${opts.reason}</p></div>` : ""}
    ${para("If you believe this is an error, please contact the brand directly.")}
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Ownership claim update — ${opts.productName}`,
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
  const priceLine = opts.salePrice
    ? `\nSale price: ${opts.currency || "NGN"} ${opts.salePrice.toLocaleString()}`
    : "";

  const subject = `${opts.fromName} is transferring ${opts.productName} to you`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:32px 24px;font-family:system-ui,-apple-system,sans-serif;background:#ffffff;color:#1F1F22;max-width:520px">
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hi ${opts.recipientName},</p>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6"><strong>${opts.fromName}</strong> is transferring ownership of <strong>${opts.productName}</strong> by ${opts.companyName} to you on Tagit.</p>
  <p style="margin:0 0 4px;font-size:13px;color:#6E6E73">Item: ${opts.productName}</p>
  <p style="margin:0 0 4px;font-size:13px;color:#6E6E73">From: ${opts.fromName}${priceLine}</p>
  <p style="margin:24px 0;font-size:15px;line-height:1.6">Click the link below to accept and become the verified owner. This link expires in 24 hours.</p>
  <p style="margin:0 0 24px"><a href="${opts.acceptanceUrl}" style="font-size:15px;color:#0A0A0B;font-weight:600">${opts.acceptanceUrl}</a></p>
  <p style="margin:0;font-size:13px;color:#6E6E73">If you weren't expecting this, you can ignore this email. The transfer will expire automatically.</p>
  <p style="margin:24px 0 0;font-size:13px;color:#9E9EA3">— Tagit</p>
</body>
</html>`;

  const text = `Hi ${opts.recipientName},\n\n${opts.fromName} is transferring ownership of ${opts.productName} by ${opts.companyName} to you on Tagit.\n\nItem: ${opts.productName}\nFrom: ${opts.fromName}${priceLine}\n\nAccept ownership here (expires in 24 hours):\n${opts.acceptanceUrl}\n\nIf you weren't expecting this, ignore this email.\n\n— Tagit`;

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
    ${heading(opts.role === "recipient" ? "Ownership transfer complete" : "Transfer complete")}
    ${opts.role === "recipient"
      ? para(`You are now the verified owner of <strong>${opts.productName}</strong> on Tagit.`)
      : para(`Ownership of <strong>${opts.productName}</strong> has been successfully transferred.`)}
    <div style="margin:24px 0">${button("View item", opts.tagUrl)}</div>
  `);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Transfer complete — ${opts.productName}`,
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
    ${heading("Authentication chip replaced")}
    ${para(greeting)}
    ${para(`<strong>${opts.brandName}</strong> has replaced the authentication chip on your item. Your ownership record is unaffected.`)}
    ${para(`If you did not expect this, contact <a href="mailto:hello@tagitlux.com">hello@tagitlux.com</a>.`)}
  `);

  const text = `${greeting}\n\n${opts.brandName} has replaced the authentication chip on your item. Your ownership record is unaffected.\n\nIf you did not expect this contact hello@tagitlux.com\n\n— Tagit`;

  await resend.emails.send({ from: FROM, to, replyTo: "hello@tagitlux.com", subject, html, text });
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
    ${heading("Application update")}
    ${para(`Thank you for applying to join Tagit, ${opts.companyName}.`)}
    ${para("After reviewing your application, we're unable to approve your account at this time.")}
    ${opts.reason ? `<div style="padding:12px 16px;background:#F5F2EC;border-radius:8px;margin:16px 0"><p style="margin:0;font-size:14px;color:#4A4A4F">${opts.reason}</p></div>` : ""}
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
    ? `Your provenance record — ${opts.productName}`
    : isTransfer
    ? `Your Certificate of Transfer — ${opts.productName}`
    : `Your Certificate of Authenticity — ${opts.productName}`;

  const html = base(`
    ${heading(isProvenance ? "Provenance Record" : isTransfer ? "Certificate of Transfer" : "Certificate of Authenticity")}
    ${isProvenance
      ? `${para(`${opts.ownerName}, the ownership of <strong>${opts.productName}</strong> has been successfully transferred.`)}
         ${para("Your provenance record is attached — it permanently confirms your previous ownership and is part of the item's immutable history on the Tagit Ownership Ledger.")}`
      : `${para(`Congratulations, ${opts.ownerName}. Your ownership of <strong>${opts.productName}</strong> by ${opts.companyName} has been recorded on Tagit.`)}
         ${para("Your certificate is attached to this email as a PDF. It is your legal proof of ownership — keep it safe.")}`
    }
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${keyVal("Certificate no.", opts.certNumber)}
      ${keyVal("Item", opts.productName)}
      ${keyVal("Brand", opts.companyName)}
    </table>
    ${!isProvenance ? `<div style="margin:24px 0">${button("View your item", opts.tagUrl)}</div>` : ""}
    ${para('<span style="color:#9E9EA3;font-size:13px">Scan the QR code on your certificate to verify authenticity at any time.</span>')}
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
