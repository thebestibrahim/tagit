/* eslint-disable @next/next/no-img-element -- logo state can be a blob URL from file input */
"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Eye, EyeOff, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/** One settings section: what it is on the left, its controls on the right. */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="st-section">
      <div className="st-intro">
        <h2 className="ov-h2">{title}</h2>
        <p className="mt-1.5 text-body-sm" style={{ color: "var(--app-body)", lineHeight: 1.55 }}>{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

const INDUSTRY_LABEL: Record<string, string> = { fashion: "Fashion", arts: "Arts", collectibles: "Collectibles" };

export default function SettingsForm({
  initialName,
  email,
  logoUrl,
  industry,
  memberSince,
}: {
  initialName: string;
  email: string;
  logoUrl: string | null;
  industry?: string | null;
  memberSince?: string | null;
}) {
  const [savedName, setSavedName] = useState(initialName);
  const [name, setName] = useState(initialName);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [logo, setLogo] = useState<string | null>(logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // The shared Input already carries the app's field style; this only sets
  // the text size used across these forms.
  const inputStyle = {
    fontSize: "var(--text-body-sm)",
  };

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    // Upload via the service-role route (same as Brand customisation). It writes
    // to the `logos` bucket and persists companies.logo_url. A direct browser
    // upload to `product-images` is rejected by that bucket's owner-scoped RLS.
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/company/logo", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    setUploadingLogo(false);
    if (!res.ok) { toast.error(json.error ?? "Logo upload failed."); return; }
    setLogo(json.logo_url);
    toast.success("Logo updated.");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    setSavingProfile(true);
    const res = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSavingProfile(false);
    if (res.ok) {
      setSavedName(name.trim());
      toast.success("Profile saved.");
    } else toast.error("Your profile wasn't saved. Try again in a moment.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("Your new password needs at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("The two new passwords don't match."); return; }
    setSavingPassword(true);

    const supabase = createClient();

    // Re-authenticate first to verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      toast.error("That isn't your current password.");
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  const since = memberSince
    ? new Date(memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;
  const nameChanged = name.trim() !== savedName;
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const logoBox = (size: number) => (
    <div
      className="rounded-lg flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size, border: "1px solid var(--app-edge)", backgroundColor: "#fff" }}
    >
      {logo ? (
        <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", padding: size > 60 ? 8 : 4 }} />
      ) : (
        <span className="font-display" style={{ fontSize: size * 0.45, fontStyle: "italic", color: "var(--color-deep-gold)" }}>
          {savedName[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* The house as it appears across Tagit */}
      <div className="card-raised flex flex-wrap items-center gap-5 px-6 py-5 mb-10">
        {logoBox(72)}
        <div className="min-w-0 flex-1">
          <p className="font-display truncate" style={{ fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--color-onyx)" }}>
            {savedName}
          </p>
          <p className="text-body-sm mt-1 truncate" style={{ color: "var(--app-body)" }}>
            {[industry ? INDUSTRY_LABEL[industry] ?? industry : null, since ? `Brand partner since ${since}` : "Brand partner"].filter(Boolean).join(". ")}
          </p>
        </div>
      </div>

      <SettingsSection
        title="Profile"
        description="Your house's name and logo, as buyers see them on scan pages, certificates and your brand page."
      >
        <form onSubmit={handleSaveProfile} className="card-raised p-6">
          <div className="flex flex-wrap items-center gap-4">
            {logoBox(56)}
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingLogo} className="ov-btn ov-btn-quiet">
                {uploadingLogo ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Upload size={14} aria-hidden />}
                {uploadingLogo ? "Uploading" : logo ? "Replace logo" : "Upload logo"}
              </button>
              <p className="mt-1.5 text-caption" style={{ color: "var(--app-body)" }}>
                PNG, JPG or WebP, up to 2 MB. The same logo is used in Customization.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
              />
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="st-name" className="cz-label">House name</Label>
            <Input id="st-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="organization" style={inputStyle} />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button type="submit" disabled={savingProfile || !nameChanged} className="ov-btn disabled:cursor-not-allowed disabled:opacity-50">
              {savingProfile ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Check size={14} aria-hidden />}
              {savingProfile ? "Saving" : "Save name"}
            </button>
            {!nameChanged && <span className="text-caption" style={{ color: "var(--app-body)" }}>No unsaved changes</span>}
          </div>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Sign-in"
        description="The email and password you use to sign in to this dashboard."
      >
        <div className="card-raised">
          <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--app-edge)" }}>
            <p className="cz-label" style={{ marginBottom: 2 }}>Email</p>
            <p className="text-body-sm" style={{ color: "var(--color-onyx)" }}>{email}</p>
            <p className="text-caption mt-1" style={{ color: "var(--app-body)" }}>
              To change it, email <a href="mailto:business@tagitlux.com" style={{ color: "var(--color-onyx)", textDecoration: "underline", textUnderlineOffset: 3 }}>business@tagitlux.com</a> from this address.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="px-6 py-5">
            <p className="cz-label" style={{ marginBottom: 12 }}>Change password</p>
            <div className="space-y-4">
              <PasswordField id="st-current" label="Current password" value={currentPassword} onChange={setCurrentPassword} shown={showCurrent} onToggle={() => setShowCurrent((v) => !v)} autoComplete="current-password" />
              <PasswordField id="st-new" label="New password" hint="At least 8 characters." value={newPassword} onChange={setNewPassword} shown={showNew} onToggle={() => setShowNew((v) => !v)} autoComplete="new-password" minLength={8} />
              <PasswordField id="st-confirm" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} shown={showNew} onToggle={() => setShowNew((v) => !v)} autoComplete="new-password" error={mismatch ? "Doesn't match the new password." : undefined} />
            </div>
            <button type="submit" disabled={savingPassword} className="ov-btn mt-5 disabled:cursor-not-allowed disabled:opacity-50">
              {savingPassword && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {savingPassword ? "Updating password" : "Update password"}
            </button>
          </form>
        </div>
      </SettingsSection>
    </>
  );
}

function PasswordField({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  shown,
  onToggle,
  autoComplete,
  minLength,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  shown: boolean;
  onToggle: () => void;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <div>
      <Label htmlFor={id} className="cz-label">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          style={{ fontSize: "var(--text-body-sm)", paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          className="absolute right-1 top-1 bottom-1 w-9 grid place-items-center rounded"
          style={{ color: "var(--app-body)" }}
        >
          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-caption" style={{ color: "#8a3b3b" }}>{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-caption" style={{ color: "var(--app-body)" }}>{hint}</p>
      ) : null}
    </div>
  );
}
