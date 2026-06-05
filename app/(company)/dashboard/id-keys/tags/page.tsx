import IDKeyListPage from "@/components/company/IDKeyListPage";

export default function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  return <IDKeyListPage medium="tag" searchParams={searchParams} />;
}
