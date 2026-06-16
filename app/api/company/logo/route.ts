import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { validateImageBytes, imageErrorResponse } from "@/lib/upload";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  const authClient = await createServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Authoritative validation by file content, not the client-declared MIME type
  // or filename. SVG is rejected (stored-XSS vector); the extension and content
  // type written to storage both come from the detected kind.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = validateImageBytes(bytes, file.type, { maxBytes: MAX_SIZE });
  if (!result.ok) {
    const { message, status } = imageErrorResponse(result.error);
    return NextResponse.json({ error: message }, { status });
  }
  const { mime, ext } = result.image;

  const admin = createAdminClient();

  const path = `${user.id}/logo.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("logos")
    .upload(path, bytes, {
      contentType: mime,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from("logos").getPublicUrl(path);
  const logo_url = urlData.publicUrl;

  const { error: dbError } = await admin
    .from("companies")
    .update({ logo_url })
    .eq("id", user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ logo_url });
}
