'use client';

import { useState } from 'react';
import { X, Key, Share2, Copy, Check, Sparkles, Loader2, Globe, RefreshCw } from 'lucide-react';

interface PublishGalleryModalProps {
  eventId: string;
  eventName: string;
  selectedCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSlug?: string;
  existingGallery?: { id: string; title: string; slug: string; isPublished: boolean };
}

export default function PublishGalleryModal({
  eventId,
  eventName,
  selectedCount,
  isOpen,
  onClose,
  onSuccess,
  existingGallery,
}: PublishGalleryModalProps) {
  const [title, setTitle] = useState(existingGallery?.title || `${eventName} - Curated Gallery`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-7 shadow-2xl relative border border-slate-800 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {existingGallery ? 'Update Customer Gallery' : 'Publish Customer Gallery'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedCount} photo{selectedCount === 1 ? '' : 's'} selected for sharing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {result ? (
          <div className="mt-6 space-y-5">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs leading-relaxed flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Gallery Published!</strong> Share this link and 6-digit PIN with your clients. They do not need to register to view their photos.
              </span>
            </div>

            <div className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-400 block mb-1.5 font-sans font-semibold text-xs uppercase tracking-wider">
                  Customer Gallery URL:
                </span>
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="truncate text-indigo-300 font-medium select-all">
                    {result.galleryUrl}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.galleryUrl, 'url')}
                    className="ml-3 text-slate-400 hover:text-white p-1 flex-shrink-0 transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5 font-sans font-semibold text-xs uppercase tracking-wider">
                  Access PIN:
                </span>
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-xl font-bold tracking-[0.25em] text-white select-all">
                    {result.accessPin}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.accessPin, 'pin')}
                    className="ml-3 text-slate-400 hover:text-white p-1 flex-shrink-0 transition-colors"
                    title="Copy PIN"
                  >
                    {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Gallery Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Access PIN (4–8 digits)
                </label>
                <button
                  type="button"
                  onClick={() => setPin(generateRandomPin())}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate New</span>
                </button>
              </div>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                required
                className="w-full px-4 py-2.5 text-lg font-mono tracking-widest text-center bg-slate-950/70 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 Only photos marked <strong>&quot;Selected for Client&quot;</strong> ({selectedCount} photos) will be visible in this gallery. Unselected photos remain completely private and isolated.
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !pin}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{existingGallery ? 'Update Gallery & PIN' : 'Publish Gallery'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
