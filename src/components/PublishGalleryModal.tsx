'use client';

import { useState } from 'react';
import { X, Key, Share2, Copy, Check, Sparkles, Loader2, Globe } from 'lucide-react';

interface PublishGalleryModalProps {
  eventId: string;
  eventName: string;
  selectedCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSlug?: string;
}

export default function PublishGalleryModal({
  eventId,
  eventName,
  selectedCount,
  isOpen,
  onClose,
  onSuccess,
}: PublishGalleryModalProps) {
  const [title, setTitle] = useState(`${eventName} - Official Gallery`);
  const [pin, setPin] = useState(generateRandomPin());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ galleryUrl: string; accessPin: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);

  function generateRandomPin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please provide a valid PIN (4-8 digits)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          pin,
          isPublished: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish gallery');
      }

      setResult({
        galleryUrl: data.galleryUrl,
        accessPin: data.accessPin,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error publishing gallery');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'url' | 'pin') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Publish Customer Gallery</h2>
              <p className="text-xs text-gray-500">
                {selectedCount} photo{selectedCount === 1 ? '' : 's'} selected for sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {result ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm">
              🎉 <strong>Gallery Published!</strong> Share this link and PIN with your customers. No account is required for them to browse.
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 font-mono text-xs">
              <div>
                <span className="text-gray-500 block mb-1 font-sans font-medium text-xs">
                  Gallery URL:
                </span>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="truncate text-indigo-600 font-medium select-all">
                    {result.galleryUrl}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.galleryUrl, 'url')}
                    className="ml-2 text-gray-500 hover:text-indigo-600 p-1 flex-shrink-0"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-gray-500 block mb-1 font-sans font-medium text-xs">
                  Access PIN:
                </span>
                <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200">
                  <span className="text-lg font-bold tracking-widest text-gray-900 select-all">
                    {result.accessPin}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.accessPin, 'pin')}
                    className="ml-2 text-gray-500 hover:text-indigo-600 p-1 flex-shrink-0"
                    title="Copy PIN"
                  >
                    {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Gallery Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Access PIN (6 Digits)
                </label>
                <button
                  type="button"
                  onClick={() => setPin(generateRandomPin())}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Random PIN</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 482917"
                  required
                  className="w-full px-3.5 py-2.5 pl-10 text-base tracking-widest font-mono font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Customers must enter this PIN to unlock and browse the published photos.
              </p>
            </div>

            {selectedCount === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                ⚠️ You currently have 0 photos selected. Customers will view an empty gallery until you select photos.
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Publish & Generate Link</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
