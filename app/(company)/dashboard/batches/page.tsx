import { redirect } from "next/navigation";

// Batches moved under the unified "ID Keys" section.
export default function LegacyBatchesPage() {
  redirect("/dashboard/id-keys/batches");
}
