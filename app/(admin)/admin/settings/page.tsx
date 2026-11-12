import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function AdminSettingsPage() {
  const user = await getUser();
  if (!user?.email) redirect("/control/signin");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="page-header mb-10">
        <h1 className="page-title">
          Settings
        </h1>
        <p className="page-desc">
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
        <ChangePasswordForm email={user.email} />
      </div>
    </div>
  );
}
