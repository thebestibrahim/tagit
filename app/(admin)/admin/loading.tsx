export default function Loading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="page-header mb-10">
        <div className="h-3 w-12 rounded mb-3" style={{ backgroundColor: "var(--color-cream)" }} />
        <div className="h-8 w-28 rounded mb-2" style={{ backgroundColor: "var(--color-cream)" }} />
        <div className="h-4 w-48 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-raised p-6">
            <div className="h-3 w-24 rounded mb-4" style={{ backgroundColor: "var(--color-linen)" }} />
            <div className="h-10 w-14 rounded mb-2" style={{ backgroundColor: "var(--color-cream)" }} />
            <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
