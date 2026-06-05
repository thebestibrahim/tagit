import { redirect } from "next/navigation";

// Tags moved under the unified "ID Keys" section.
export default function LegacyTagsPage() {
  redirect("/dashboard/id-keys/tags");
}
