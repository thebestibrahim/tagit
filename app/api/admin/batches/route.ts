import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { nanoid, customAlphabet } from "nanoid";
import { createHmac } from "crypto";
import type { TagStatus, Industry } from "@/types/database";

const shortId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

function generateHmac(token: string): string {
  return createHmac("sha256", process.env.TAGIT_HMAC_SECRET!)
    .update(token)
    .digest("hex");
}

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { company_id, industry, batch_size, notes, batch_name } = await request.json();

  if (!company_id || !industry || !batch_size) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!Number.isInteger(batch_size) || batch_size < 1 || batch_size > 10000) {
    return NextResponse.json({ error: "Batch size must be between 1 and 10,000." }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: batchData, error: batchError } = await admin
    .from("tag_batches")
    .insert({
      company_id,
      industry,
      batch_size,
      notes: notes ?? null,
      batch_name: batch_name?.trim() || null,
      created_by: user.id,
      status: "pending" as const,
    })
    .select("id")
    .single();

  if (batchError) {
    return NextResponse.json({ error: batchError.message }, { status: 500 });
  }

  const batchId = (batchData as { id: string }).id;

  const tags = Array.from({ length: batch_size }, () => {
    const token = nanoid(21);
    return {
      token,
      short_id: shortId(),
      company_id,
      industry,
      batch_id: batchId,
      status: "created" as TagStatus,
      hmac_signature: generateHmac(token),
    };
  });

  // Insert in chunks of 500 to avoid request size limits
  const chunkSize = 500;
  for (let i = 0; i < tags.length; i += chunkSize) {
    const chunk = tags.slice(i, i + chunkSize);
    const { error } = await admin.from("tags").insert(chunk);
    if (error) {
      await admin.from("tag_batches").delete().eq("id", batchId);
      log.error("admin/batches", "Tag insert failed", error);
      return NextResponse.json({ error: "Tag generation failed" }, { status: 500 });
    }
  }

  await admin
    .from("tag_batches")
    .update({ status: "generated" as const })
    .eq("id", batchId);

  return NextResponse.json({ success: true, batch_id: batchId, count: batch_size });
}
