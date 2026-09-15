'use client';

import { useEffect } from 'react';
import { Camera, Lock, RotateCcw } from 'lucide-react';

export default function GalleryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Gallery loading error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 mb-5">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold mb-2">Unable to Load Gallery</h2>
        <p className="text-xs text-slate-400 mb-6">
          This gallery could not be loaded. It may have expired, or the PIN session may need to be refreshed.
        </p>

        <button
          onClick={() => reset()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Gallery</span>
        </button>
      </div>
    </div>
  );
}
