"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { c } from "@/components/landing/styles";
import {
  AuthLeftPanel,
  AuthRightPanel,
  AuthEyebrow,
  AuthHeading,
  AuthSubmitButton,
  FieldLabel,
  authInputBase,
  authFocusInput,
  authBlurInput,
  authOuter,
  authResponsiveCss,
} from "@/components/auth/auth-chrome";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Generic message — don't reveal whether the email exists or is confirmed.
      toast.error("Invalid email or password.");
      setLoading(false);
      return;
    }

    // This is the brand partner portal — companies only. Staff sign in elsewhere.
    const role = data.user?.app_metadata?.role;
    if (role === "company") {
      router.push("/dashboard");
    } else {
      await supabase.auth.signOut();
      toast.error("Invalid email or password.");
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  return (
    <div style={authOuter}>
      <AuthLeftPanel
        eyebrow="Brand partner portal"
        heading="Proof that stays with the piece."
        body="Your catalogue, your ownership ledger, and your customers' voice — all in one place."
        features={[
          "Cryptographic tag authentication",
          "A permanent ownership ledger",
          "An AI voice persona for your brand",
          "Built for the EU DPP mandate",
        ]}
      />

      <AuthRightPanel backHref="/" backLabel="Back to site">
        <AuthEyebrow>Sign in</AuthEyebrow>
        <AuthHeading>Welcome back.</AuthHeading>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <input
              id="email"
              type="email"
              placeholder="you@brand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onFocus={authFocusInput}
              onBlur={authBlurInput}
              style={authInputBase}
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link href="/auth/forgot-password" style={{ fontSize: 14, color: c.quiet, textDecoration: "none", letterSpacing: "-0.003em" }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              onFocus={authFocusInput}
              onBlur={authBlurInput}
              style={authInputBase}
            />
          </div>

          <AuthSubmitButton loading={loading}>
            {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Signing in…" : "Sign in"}
          </AuthSubmitButton>
        </form>

        <p style={{ marginTop: 24, fontSize: 15, color: c.quiet, letterSpacing: "-0.003em" }}>
          New brand partner?{" "}
          <Link href="/auth/register" style={{ color: c.body, textDecoration: "none", borderBottom: `1px solid ${c.line}` }}>
            Apply for access →
          </Link>
        </p>
      </AuthRightPanel>

      <style>{authResponsiveCss}</style>
    </div>
  );
}
