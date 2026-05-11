export default function Loading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="page-header mb-8">
        <div className="h-3 w-16 rounded mb-3" style={{ backgroundColor: "var(--color-cream)" }} />
        <div className="h-8 w-28 rounded mb-2" style={{ backgroundColor: "var(--color-cream)" }} />
        <div className="h-4 w-56 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
      </div>
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ backgroundColor: "var(--color-linen)" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-16 rounded-md" style={{ backgroundColor: "var(--color-cream)" }} />
        ))}
      </div>
      <div className="card-raised rounded-xl overflow-hidden" style={{ padding: 0 }}>
        <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--color-cream)", backgroundColor: "var(--color-smoke)" }}>
          <div className="h-3 w-80 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-4" style={{ borderBottom: "1px solid var(--color-cream)" }}>
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--color-cream)" }} />
              <div className="h-3 w-32 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
            </div>
            <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
            <div className="h-5 w-14 rounded-full" style={{ backgroundColor: "var(--color-linen)" }} />
            <div className="h-4 w-20 rounded" style={{ backgroundColor: "var(--color-linen)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
