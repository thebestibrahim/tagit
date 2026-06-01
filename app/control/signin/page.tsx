import type { Metadata } from "next";
import AdminSignInForm from "./AdminSignInForm";

// Keep the staff portal out of search engines entirely.
export const metadata: Metadata = {
  title: "Staff Sign In",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminSignInPage() {
  return <AdminSignInForm />;
}
