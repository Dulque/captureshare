import { Camera, Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Animated Brand Logo */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-pulse">
            <Camera className="w-8 h-8" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Capture<span className="text-indigo-600">Share</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1 animate-pulse">
          Loading your experience...
        </p>

        {/* Progress Bar Indicator */}
        <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-6">
          <div className="w-full h-full bg-indigo-600 rounded-full animate-indeterminate origin-left" />
        </div>
      </div>
    </div>
  );
}
