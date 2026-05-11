import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { nanoid, customAlphabet } from "nanoid";
import { createHmac } from "crypto";

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

  const { company_id, industry, batch_size, notes } = await request.json();

  if (!company_id || !industry || !batch_size) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const VALID_SIZES = [50, 100, 250, 500, 1000];
  if (!VALID_SIZES.includes(batch_size)) {
    return NextResponse.json({ error: "Invalid batch size." }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: batchData, error: batchError } = await admin
    .from("tag_batches")
    .insert({
      company_id,
      industry,
      batch_size,
      notes: notes ?? null,
      created_by: user.id,
      status: "pending",
    } as never)
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
      status: "created",
      hmac_signature: generateHmac(token),
    };
  });

  // Insert in chunks of 500 to avoid request size limits
  const chunkSize = 500;
  for (let i = 0; i < tags.length; i += chunkSize) {
    const chunk = tags.slice(i, i + chunkSize);
    const { error } = await admin.from("tags").insert(chunk as never);
    if (error) {
      await admin.from("tag_batches").delete().eq("id", batchId);
      return NextResponse.json({ error: "Tag generation failed: " + error.message }, { status: 500 });
    }
  }

  await admin
    .from("tag_batches")
    .update({ status: "generated" } as never)
    .eq("id", batchId);

  return NextResponse.json({ success: true, batch_id: batchId, count: batch_size });
}
