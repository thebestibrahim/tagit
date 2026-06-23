"use server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { Database } from "@/types/database";
import { sendInquiryReceivedEmail } from "@/lib/email";
import { log } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Tagit <info@tagitlux.com>";

export async function submitBrandInquiry(data: {
  name: string;
  email: string;
  company: string;
  phone?: string;
}) {
  const { name, email, company, phone } = data;

  // Save to database first (works even if email fails)
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.from("brand_inquiries").insert({
    name,
    email,
    company,
    phone: phone || null,
    status: "new",
  });

  // Send emails (best-effort; don't throw if Resend isn't configured).
  // Sequential, not parallel: Resend's rate limit (~2 req/s) means firing both
  // sends at once can intermittently drop one, and the applicant's confirmation
  // was the one going missing. So send it FIRST and on its own, then notify the
  // team. Each send is awaited and logged so a failure is visible in the logs
  // instead of being silently swallowed.
  if (process.env.RESEND_API_KEY) {
    try {
      await sendInquiryReceivedEmail(email, { name, company });
    } catch (err) {
      log.error("brand-inquiry", "Applicant confirmation email failed", err);
    }

    try {
      await resend.emails.send({
        from: FROM,
        to: "business@tagitlux.com",
        subject: `New brand access request from ${company}`,
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
    } catch (err) {
      log.error("brand-inquiry", "Internal notification email failed", err);
    }
  }
}
