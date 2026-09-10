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
  ShieldAlert
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // If not unlocked with PIN yet: Show PIN Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 py-12 text-slate-100">
        <div className="max-w-md w-full text-center">
          {/* Brand icon */}
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-500/20 mb-6 border border-indigo-400/30">
            <Lock className="w-7 h-7" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            PIN-Protected Event Gallery
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
            Please enter the 6-digit access PIN provided by your photographer or event host.
          </p>

          <div className="mt-8 bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
            {error && (
              <div className="mb-6 p-3.5 bg-red-950/70 border border-red-800/80 text-red-200 text-xs rounded-2xl flex items-start space-x-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{error}</p>
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="mt-0.5 text-[11px] text-red-300">
                      Remaining attempts before temporary lockout: {remainingAttempts}
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyPin} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Access PIN
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
                    className="w-full text-center text-3xl tracking-widest font-mono py-3.5 px-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition-all placeholder:text-slate-700"
                  />
                  <KeyRound className="w-5 h-5 text-slate-600 absolute left-4 top-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !pin}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <span>Unlock Gallery</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-500">
                No customer registration required • Secured by TrizenShare
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked: Customer Gallery Viewer
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
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
            <span className="hidden sm:inline px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
              {photos.length} Published Photos
            </span>
            {gallery?.eventDate && (
              <span className="hidden sm:flex items-center space-x-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(gallery.eventDate).toLocaleDateString()}</span>
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
                className="group relative break-inside-avoid rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all duration-300 shadow-md hover:shadow-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.storageUrl}
                  alt={photo.filename}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Hover overlay with quick preview and download */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                  <div className="flex justify-end">
                    <span className="p-1.5 rounded-xl bg-black/60 backdrop-blur text-white">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold truncate leading-tight">
                      {photo.filename}
                    </p>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      {(photo.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        Published via TrizenShare Platform • Powered by TrizenAI
      </footer>
    </div>
  );
}
