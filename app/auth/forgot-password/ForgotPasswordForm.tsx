"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthTitle, AuthLead, Field, FormError, SubmitButton, authStyles as s } from "@/components/auth/auth-chrome";
import { RoomSeal } from "@/components/auth/certificate";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "link_expired";
  const isAdmin = searchParams.get("type") === "admin";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(linkExpired ? "That reset link has expired. Enter your email and we'll send a new one." : "");

  // Admins have their own portal. /auth/login is the brand-only form and
  // rejects non-company roles outright.
  const loginHref = isAdmin ? "/control/signin" : "/auth/login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const next = isAdmin ? "/auth/reset-password?type=admin" : "/auth/reset-password";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${isAdmin ? "&type=admin" : ""}`;

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <AuthShell room={<RoomSeal />} caption="Proof that stays with the piece." backHref={loginHref} backLabel="Back to sign in">
      {sent ? (
        <>
          <AuthTitle>Check your inbox</AuthTitle>
          <AuthLead>
            If <strong>{email}</strong> has a Tagit account, a reset link is on its way. It works once and expires in an hour.
            If it isn&apos;t there in a few minutes, check your spam folder.
          </AuthLead>
          <div className={s.actions}>
            <button
              type="button"
              className={s.textLink}
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Use a different email
            </button>
          </div>
        </>
      ) : (
        <>
          <AuthTitle>Reset your password</AuthTitle>
          <AuthLead>Enter the email you sign in with and we&apos;ll send you a link to choose a new password.</AuthLead>

          <form onSubmit={handleSubmit} className={s.form}>
            <Field
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@brand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormError>{error}</FormError>
            <SubmitButton loading={loading} loadingLabel="Sending link">
              Send reset link
            </SubmitButton>
          </form>
        </>
      )}
    </AuthShell>
  );
}
