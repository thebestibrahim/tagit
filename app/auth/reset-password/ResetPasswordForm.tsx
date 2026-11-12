"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthTitle, AuthLead, Field, FormError, SubmitButton, authStyles as s } from "@/components/auth/auth-chrome";
import { RoomSeal } from "@/components/auth/certificate";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("type") === "admin";
  // Admins have their own portal. /auth/login is the brand-only form and
  // rejects non-company roles outright.
  const loginHref = isAdmin ? "/control/signin" : "/auth/login";
  const forgotHref = isAdmin ? "/auth/forgot-password?type=admin" : "/auth/forgot-password";

  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setSessionError(true);
    });
  }, []);

  // Only flag length once they have moved on to confirm it, not mid-typing.
  const tooShort = confirm.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Your new password needs at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setDone(true);
    setLoading(false);
    setTimeout(() => router.push(loginHref), 3000);
  }

  let body: React.ReactNode;
  if (done) {
    body = (
      <>
        <AuthTitle>Password updated</AuthTitle>
        <AuthLead>Taking you to sign in with your new password.</AuthLead>
        <div className={s.actions}>
          <Link href={loginHref} className={`${s.button} ${s.buttonAuto}`}>
            Sign in now
          </Link>
        </div>
      </>
    );
  } else if (sessionError) {
    body = (
      <>
        <AuthTitle>This link has expired</AuthTitle>
        <AuthLead>Reset links work once and expire after an hour. Request a new one and use the latest email.</AuthLead>
        <div className={s.actions}>
          <Link href={forgotHref} className={`${s.button} ${s.buttonAuto}`}>
            Request a new link
          </Link>
        </div>
      </>
    );
  } else if (!ready) {
    body = (
      <p className={s.status} role="status">
        <Loader2 size={16} className={s.spin} aria-hidden />
        Checking your reset link
      </p>
    );
  } else {
    body = (
      <>
        <AuthTitle>Choose a new password</AuthTitle>
        <AuthLead>You&apos;ll use it the next time you sign in.</AuthLead>
        <form onSubmit={handleSubmit} className={s.form}>
          <Field
            label="New password"
            type="password"
            name="password"
            autoComplete="new-password"
            hint="At least 8 characters. A short phrase is easier to remember and harder to guess."
            error={tooShort ? "At least 8 characters." : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <Field
            label="Confirm new password"
            type="password"
            name="confirm"
            autoComplete="new-password"
            error={mismatch ? "Doesn't match the password above." : undefined}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <FormError>{error}</FormError>
          <SubmitButton loading={loading} loadingLabel="Saving password">
            Save new password
          </SubmitButton>
        </form>
      </>
    );
  }

  return (
    <AuthShell room={<RoomSeal />} caption="Proof that stays with the piece." backHref={loginHref} backLabel="Back to sign in">
      {body}
    </AuthShell>
  );
}
