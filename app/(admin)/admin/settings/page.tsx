import ChangePasswordForm from "./ChangePasswordForm";

export default function AdminSettingsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="page-header mb-10">
        <p className="text-micro font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>
          Admin
        </p>
        <h1 className="font-display" style={{ fontSize: "32px", color: "var(--color-charcoal)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p className="mt-1" style={{ color: "var(--color-slate)", fontSize: "var(--text-body-sm)" }}>
          Manage your admin account
        </p>
      </div>

      <div className="card-raised p-8">
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-charcoal)", letterSpacing: "-0.01em", marginBottom: 4 }}>
          Change password
        </h2>
        <p style={{ fontSize: 13, color: "var(--color-slate)", marginBottom: 28 }}>
          Set a new password for your admin account.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
