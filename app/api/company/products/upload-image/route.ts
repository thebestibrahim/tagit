import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { validateImageBytes, imageErrorResponse } from "@/lib/upload";

// POST /api/company/products/upload-image
// Server-side product-photo upload. Replaces the old browser→storage direct
// upload so every image is validated by its real bytes (no malware renamed to
// .png, no SVG) before it lands in the public bucket. Returns the public URL.
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB — product photos run larger than logos

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = validateImageBytes(bytes, file.type, { maxBytes: MAX_SIZE });
  if (!result.ok) {
    const { message, status } = imageErrorResponse(result.error);
    return NextResponse.json({ error: message }, { status });
  }
  const { mime, ext } = result.image;

  // Key is pinned to the authenticated company's own folder + a random name;
  // never derived from the client filename.
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(path, bytes, { contentType: mime, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: urlData.publicUrl });
}
