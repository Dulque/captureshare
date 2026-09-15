export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header Skeleton */}
      <header className="h-20 border-b border-slate-800/80 px-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-48 h-6 bg-slate-800 rounded-lg animate-pulse" />
          <div className="w-32 h-3 bg-slate-900 rounded animate-pulse" />
        </div>
        <div className="w-28 h-9 bg-slate-800 rounded-xl animate-pulse" />
      </header>

      {/* Masonry Photo Grid Skeleton */}
      <main className="max-w-7xl mx-auto w-full p-6">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {[260, 380, 200, 340, 290, 420, 220, 310].map((height, i) => (
            <div
              key={i}
              style={{ height: `${height}px` }}
              className="w-full bg-slate-900 rounded-2xl animate-pulse break-inside-avoid border border-slate-800/50"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
