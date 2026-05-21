import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";
import { nanoid, customAlphabet } from "nanoid";
import { createHmac } from "crypto";
import type { TagStatus } from "@/types/database";

const shortId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

function generateHmac(token: string): string {
  return createHmac("sha256", process.env.TAGIT_HMAC_SECRET!)
    .update(token)
    .digest("hex");
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: batchId } = await params;

  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || user.app_metadata?.role !== "tagit_admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: batchData, error: fetchError } = await admin
    .from("tag_batches")
    .select("id, company_id, industry, batch_size, status")
    .eq("id", batchId)
    .single();

  if (fetchError || !batchData) {
    return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  }

  const batch = batchData as {
    id: string; company_id: string; industry: string; batch_size: number; status: string;
  };

  if (batch.status !== "pending") {
    return NextResponse.json({ error: "This batch has already been processed." }, { status: 400 });
  }

  const tags = Array.from({ length: batch.batch_size }, () => {
    const token = nanoid(21);
    return {
      token,
      short_id: shortId(),
      company_id: batch.company_id,
      industry: batch.industry,
      batch_id: batchId,
      status: "created" as TagStatus,
      hmac_signature: generateHmac(token),
    };
  });

  const chunkSize = 500;
  for (let i = 0; i < tags.length; i += chunkSize) {
    const { error } = await admin.from("tags").insert(tags.slice(i, i + chunkSize));
    if (error) {
      log.error("admin/batches/approve", "Tag insert failed", error);
      return NextResponse.json({ error: "Tag generation failed" }, { status: 500 });
    }
  }

  const { error: updateError } = await admin
    .from("tag_batches")
    .update({ status: "generated" })
    .eq("id", batchId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: batch.batch_size });
}
