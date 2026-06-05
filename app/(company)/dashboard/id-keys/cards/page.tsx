import IDKeyListPage from "@/components/company/IDKeyListPage";

export default function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  return <IDKeyListPage medium="card" searchParams={searchParams} />;
}
