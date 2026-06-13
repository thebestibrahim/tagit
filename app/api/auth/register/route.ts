import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { rateLimitAsync, getIp } from "@/lib/rate-limit";
import { log } from "@/lib/logger";
import type { Industry } from "@/types/database";

const ALLOWED_INDUSTRIES: Industry[] = ["fashion", "arts", "collectibles"];

export async function POST(request: Request) {
  const ip = getIp(request);
  if (!await rateLimitAsync(`register:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { name, email, password, industry, contact_name, contact_phone } = await request.json();

    if (!name || !email || !password || !industry || !contact_name) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!ALLOWED_INDUSTRIES.includes(industry)) {
      return NextResponse.json({ error: "Invalid industry." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: userData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      app_metadata: { role: "company" },
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = userData.user.id;

    const { error: dbError } = await admin.from("companies").insert({
      id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      industry,
      status: "pending",
      contact_name: contact_name.trim(),
      ...(contact_phone?.trim() ? { contact_phone: contact_phone.trim() } : {}),
    });

    if (dbError) {
      log.error("register", "companies insert failed", dbError);
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Failed to create company profile." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error("register", "unexpected error", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
