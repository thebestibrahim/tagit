/* eslint-disable @next/next/no-img-element -- logo state can be a blob URL from file input */
"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Eye, EyeOff, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function SettingsForm({
  initialName,
  email,
  logoUrl,
}: {
  initialName: string;
  email: string;
  logoUrl: string | null;
}) {
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

  const inputStyle = {
    backgroundColor: "var(--color-pearl)",
    borderColor: "var(--color-stone)",
    color: "var(--color-onyx)",
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
    if (res.ok) toast.success("Profile updated.");
    else toast.error("Failed to update profile.");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }
    setSavingPassword(true);

    const supabase = createClient();

    // Re-authenticate first to verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      toast.error("Current password is incorrect.");
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

  const cardStyle = {
    backgroundColor: "var(--color-pearl)",
    border: "1px solid var(--color-cream)",
    boxShadow: "var(--shadow-sm)",
  };

  return (
    <div className="space-y-6">
      {/* Company profile */}
      <form onSubmit={handleSaveProfile} className="rounded-xl p-6" style={cardStyle}>
        <h2 className="text-body font-semibold mb-5" style={{ color: "var(--color-charcoal)" }}>
          Company profile
        </h2>

        {/* Logo */}
        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
            style={{ border: "1px solid var(--color-cream)", backgroundColor: "var(--color-linen)" }}
          >
            {logo ? (
              <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-gold)" }}>
                {initialName[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingLogo}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium"
              style={{
                border: "1px solid var(--color-stone)",
                backgroundColor: "var(--color-pearl)",
                color: "var(--color-graphite)",
                cursor: uploadingLogo ? "not-allowed" : "pointer",
              }}
            >
              {uploadingLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploadingLogo ? "Uploading…" : "Upload logo"}
            </button>
            <p className="mt-1.5" style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
              PNG or JPG, max 2 MB
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

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              Company name
            </Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              Email address
            </Label>
            <Input
              type="email"
              value={email}
              disabled
              style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
            />
            <p style={{ fontSize: "var(--text-caption)", color: "var(--color-mist)" }}>
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-body-sm"
          style={{
            backgroundColor: savingProfile ? "var(--color-stone)" : "var(--color-onyx)",
            color: "var(--color-pearl)",
            border: "none",
            cursor: savingProfile ? "not-allowed" : "pointer",
          }}
        >
          {savingProfile ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="rounded-xl p-6" style={cardStyle}>
        <h2 className="text-body font-semibold mb-1" style={{ color: "var(--color-charcoal)" }}>
          Change password
        </h2>
        <p className="mb-5" style={{ fontSize: "var(--text-body-sm)", color: "var(--color-slate)" }}>
          Must be at least 8 characters.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              Current password
            </Label>
            <div style={{ position: "relative" }}>
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ ...inputStyle, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-mist)", padding: 0 }}
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              New password
            </Label>
            <div style={{ position: "relative" }}>
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ ...inputStyle, paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-mist)", padding: 0 }}
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label style={{ color: "var(--color-graphite)", fontSize: "var(--text-body-sm)" }}>
              Confirm new password
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                ...inputStyle,
                borderColor: confirmPassword && confirmPassword !== newPassword ? "var(--color-alert)" : "var(--color-stone)",
              }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p style={{ fontSize: "var(--text-caption)", color: "var(--color-alert)" }}>
                Passwords do not match
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-body-sm"
          style={{
            backgroundColor: savingPassword ? "var(--color-stone)" : "var(--color-onyx)",
            color: "var(--color-pearl)",
            border: "none",
            cursor: savingPassword ? "not-allowed" : "pointer",
          }}
        >
          {savingPassword ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {savingPassword ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
