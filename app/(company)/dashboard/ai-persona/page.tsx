import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentBrandFlags } from "@/lib/feature-flags/server";
import FeatureWall from "@/components/company/FeatureWall";
import PersonaForm from "./PersonaForm";

export default async function AiPersonaPage() {
  const supabase = await createClient();
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const flags = await getCurrentBrandFlags();
  if (!flags.ai_persona) {
    return (
      <FeatureWall
        name="AI Product Persona"
        description="Give your items a voice your customers can speak with after a scan."
      />
    );
  }

  const { data: companyData } = await supabase
    .from("companies")
    .select("ai_enabled, ai_persona_name, ai_persona_prompt, ai_persona_voice_id, elevenlabs_api_key")
    .eq("id", user.id)
    .single();

  const company = companyData as {
    ai_enabled: boolean;
    ai_persona_name: string | null;
    ai_persona_prompt: string | null;
    ai_persona_voice_id: string | null;
    elevenlabs_api_key: string | null;
  } | null;

  if (!company) redirect("/auth/unauthorized");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="page-header mb-8">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Intelligence
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          AI Persona
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Configure an AI voice assistant for your product scan pages. Customers can speak with your brand persona after scanning a tag.
        </p>
      </div>

      <PersonaForm
        initialValues={{
          ai_enabled: company.ai_enabled ?? false,
          ai_persona_name: company.ai_persona_name ?? "",
          ai_persona_prompt: company.ai_persona_prompt ?? "",
          ai_persona_voice_id: company.ai_persona_voice_id ?? "21m00Tcm4TlvDq8ikWAM",
          has_custom_key: Boolean(company.elevenlabs_api_key),
        }}
      />
    </div>
  );
}
