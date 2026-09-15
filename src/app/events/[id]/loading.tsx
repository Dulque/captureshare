export default function EventLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar Skeleton */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-slate-200 animate-pulse" />
          <div className="w-32 h-5 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="w-24 h-8 bg-slate-200 rounded-xl animate-pulse" />
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Banner Skeleton */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
          <div className="w-64 h-8 bg-slate-200 rounded-lg animate-pulse" />
          <div className="w-96 h-4 bg-slate-100 rounded animate-pulse" />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="w-16 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="w-12 h-6 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Upload Dropzone Skeleton */}
        <div className="h-44 border-2 border-dashed border-slate-200 bg-white rounded-3xl flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="w-48 h-4 bg-slate-100 rounded animate-pulse" />
        </div>

        {/* Photo Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
