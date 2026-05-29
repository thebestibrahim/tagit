"use server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Tagit <info@tagitlux.com>";

export async function submitBrandInquiry(data: {
  name: string;
  email: string;
  company: string;
  phone?: string;
}) {
  const { name, email, company, phone } = data;

  // Notify the Tagit team
  await resend.emails.send({
    from: FROM,
    to: "business@tagitlux.com",
    subject: `New brand access request — ${company}`,
    html: `
      <div style="font-family:system-ui,sans-serif;padding:32px;background:#FAFAF8;max-width:520px">
        <h2 style="margin:0 0 24px;font-size:20px;color:#0A0A0B">New brand access request</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;font-size:13px;color:#9E9EA3;width:35%">Name</td><td style="padding:8px 0;font-size:14px;color:#1F1F22;font-weight:500">${name}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#9E9EA3">Email</td><td style="padding:8px 0;font-size:14px;color:#1F1F22;font-weight:500">${email}</td></tr>
          <tr><td style="padding:8px 0;font-size:13px;color:#9E9EA3">Brand / Company</td><td style="padding:8px 0;font-size:14px;color:#1F1F22;font-weight:500">${company}</td></tr>
          ${phone ? `<tr><td style="padding:8px 0;font-size:13px;color:#9E9EA3">Phone / WhatsApp</td><td style="padding:8px 0;font-size:14px;color:#1F1F22;font-weight:500">${phone}</td></tr>` : ""}
        </table>
        <p style="margin:24px 0 0;font-size:13px;color:#9E9EA3">Reply directly to this email to start the conversation.</p>
      </div>
    `,
    replyTo: email,
  });

  // Confirmation to the brand
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "We've received your request — Tagit",
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:32px 24px;font-family:system-ui,-apple-system,sans-serif;background:#ffffff;color:#1F1F22;max-width:520px">
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6">Hi ${name},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6">
          Thank you for your interest in Tagit. We've received your access request for <strong>${company}</strong> and will be in touch within 48 hours.
        </p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6">
          In the meantime, feel free to reply to this email with any questions.
        </p>
        <p style="margin:0;font-size:13px;color:#9E9EA3">— The Tagit Team</p>
        <p style="margin:24px 0 0;font-size:13px;color:#C7C7CC">business@tagitlux.com</p>
      </body>
      </html>
    `,
  });
}
