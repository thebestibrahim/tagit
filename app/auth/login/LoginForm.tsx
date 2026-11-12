"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthTitle, AuthLead, Field, FormError, SubmitButton, authStyles as s } from "@/components/auth/auth-chrome";
import { RoomSeal } from "@/components/auth/certificate";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    // Generic message either way: don't reveal whether the email exists, is
    // confirmed, or belongs to a staff account (staff sign in elsewhere).
    if (authError || data.user?.app_metadata?.role !== "company") {
      if (!authError) await supabase.auth.signOut();
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <AuthShell
      room={<RoomSeal />}
      caption="Proof that stays with the piece."
      aside={
        <>
          <span className={s.topAsideLead}>New to Tagit?</span>
          <Link href="/auth/register">Apply for access</Link>
        </>
      }
    >
      <AuthTitle>Sign in to Tagit</AuthTitle>
      <AuthLead>Your catalogue, certificates and ownership records.</AuthLead>

      <form onSubmit={handleLogin} className={s.form}>
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
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          labelAside={
            <Link href="/auth/forgot-password" className={s.quietLink}>
              Forgot password?
            </Link>
          }
        />

        <FormError>{error}</FormError>

        <SubmitButton loading={loading} loadingLabel="Signing in">
          Sign in
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
