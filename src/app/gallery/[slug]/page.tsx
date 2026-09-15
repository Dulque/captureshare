'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Lock,
  Camera,
  Calendar,
  KeyRound,
  Download,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  Maximize2
} from 'lucide-react';
import PhotoLightbox from '@/components/PhotoLightbox';

interface GalleryPhoto {
  id: string;
  filename: string;
  storageUrl: string;
  fileSize: number;
  createdAt: string;
}

interface GalleryData {
  id: string;
  title: string;
  slug: string;
  eventName: string;
  eventDescription?: string;
  eventDate?: string;
}

export default function CustomerGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gallery, setGallery] = useState<GalleryData | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Lightbox viewer state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Check if user already has an active session cookie for this gallery
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/gallery/${slug}/photos`);
      if (res.ok) {
        const data = await res.json();
        setGallery(data.gallery);
        setPhotos(data.photos);
        setIsAuthenticated(true);
      }
    } catch {
      // Not authenticated yet
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/gallery/${slug}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRemainingAttempts(data.remainingAttempts ?? null);
        throw new Error(data.error || 'Invalid PIN');
      }

      // PIN valid, now fetch the photos
      await checkSession();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse mb-3">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
      </div>
    );
  }

  // If not unlocked with PIN yet: Show PIN Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 py-12 text-slate-100 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-md w-full text-center">
          {/* Brand icon */}
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-600/30 mb-6 border border-indigo-500/30">
            <Lock className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[11px] font-bold uppercase tracking-wider rounded-full border border-indigo-500/20 mb-3">
            Client Portal
          </span>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Enter PIN to Access Gallery
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Please enter the 6-digit access PIN provided by your photographer or event host.
          </p>

          <div className="mt-8 bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl shadow-black/50 text-left">
            {error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="mt-1 text-[11px] text-rose-300">
                      Remaining attempts before temporary lockout: {remainingAttempts}
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
                  6-Digit Event Access PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={8}
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    required
                    className="w-full text-center text-3xl tracking-[0.35em] font-mono py-4 px-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-700"
                  />
                  <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !pin}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Unlock Gallery</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-500 flex items-center justify-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Zero registration required • Powered by CaptureShare</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked: Customer Gallery Viewer
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                {gallery?.eventName || gallery?.title}
              </h1>
              <p className="text-xs text-slate-400">{gallery?.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-200 font-semibold shadow-xs">
              {photos.length} Published Photos
            </span>
            {gallery?.eventDate && (
              <span className="hidden sm:flex items-center space-x-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(gallery.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {photos.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">Photos are being processed</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              The photographer hasn&apos;t published selected photos yet. Please check back shortly.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(idx)}
                className="group relative break-inside-avoid rounded-2xl overflow-hidden bg-slate-900 border border-slate-800/90 hover:border-indigo-500/50 cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-0.5"
              >
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.storageUrl}
                  alt={photo.filename}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Hover overlay with quick preview and download */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 text-white">
                  <div className="flex justify-end">
                    <span className="p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/90">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate max-w-[140px] text-slate-200">
                      {photo.filename}
                    </span>
                    <a
                      href={photo.storageUrl}
                      download={photo.filename}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 bg-indigo-600/90 hover:bg-indigo-600 rounded-lg text-white shadow transition-colors flex items-center justify-center"
                      title="Download high-resolution image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Viewer */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos.map((p) => ({
            id: p.id,
            filename: p.filename,
            storageUrl: p.storageUrl,
          }))}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(idx) => setLightboxIndex(idx)}
        />
      )}
    </div>
  );
}
