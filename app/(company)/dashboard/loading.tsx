export default function Loading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="page-header mb-10">
        <div className="h-3 w-16 rounded mb-3" style={{ backgroundColor: "var(--color-cream)" }} />
        <div className="h-8 w-32 rounded mb-2" style={{ backgroundColor: "var(--color-cream)" }} />
        <div className="h-4 w-48 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card-raised p-6">
            <div className="h-8 w-8 rounded-lg mb-4" style={{ backgroundColor: "var(--color-linen)" }} />
            <div className="h-9 w-12 rounded mb-2" style={{ backgroundColor: "var(--color-cream)" }} />
            <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
          </div>
        ))}
      </div>

      {/* Action cards skeleton */}
      <div className="h-4 w-24 rounded mb-4" style={{ backgroundColor: "var(--color-cream)" }} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-raised p-5">
            <div className="h-4 w-32 rounded mb-2" style={{ backgroundColor: "var(--color-cream)" }} />
            <div className="h-3 w-40 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
