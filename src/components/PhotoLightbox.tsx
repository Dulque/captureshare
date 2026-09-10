'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Calendar, User } from 'lucide-react';

interface LightboxPhoto {
  id: string;
  filename: string;
  storageUrl: string;
  fileSize?: number;
  createdAt?: string;
  uploadedBy?: { name: string };
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  if (!currentPhoto) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.storageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentPhoto.filename || 'photo.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(currentPhoto.storageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none">
      {/* Top action bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex items-center space-x-4 truncate">
          <span className="text-sm font-medium text-gray-300">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-sm font-semibold truncate text-white max-w-xs sm:max-w-md">
            {currentPhoto.filename}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center space-x-1.5 text-xs font-medium"
            title="Download photo"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation buttons */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Image container */}
      <div className="relative max-w-6xl max-h-[80vh] w-full h-full flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.storageUrl}
          alt={currentPhoto.filename}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all"
        />
      </div>

      {/* Bottom metadata */}
      <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-center space-x-6 text-xs text-gray-400 bg-gradient-to-t from-black/70 to-transparent">
        {currentPhoto.uploadedBy && (
          <span className="flex items-center space-x-1">
            <User className="w-3.5 h-3.5" />
            <span>Uploaded by {currentPhoto.uploadedBy.name}</span>
          </span>
        )}
        {currentPhoto.createdAt && (
          <span className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(currentPhoto.createdAt).toLocaleDateString()}</span>
          </span>
        )}
        {currentPhoto.fileSize && (
          <span>{(currentPhoto.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
        )}
      </div>
    </div>
  );
}
