'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  UserPlus,
  Share2,
  CheckSquare,
  Square,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  Users,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Camera
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import UploadModal from '@/components/UploadModal';
import PublishGalleryModal from '@/components/PublishGalleryModal';
import AddMemberModal from '@/components/AddMemberModal';
import PhotoLightbox from '@/components/PhotoLightbox';
import { UserSession } from '@/lib/types';

interface PhotoItem {
  id: string;
  filename: string;
  storageUrl: string;
  fileSize: number;
  isSelected: boolean;
  createdAt: string;
  uploadedBy: { id: string; name: string; email: string };
}

interface EventDetail {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  adminId: string;
  admin: { id: string; name: string; email: string };
  members: Array<{ user: { id: string; name: string; email: string; role: string } }>;
  galleries: Array<{ id: string; title: string; slug: string; isPublished: boolean }>;
  photos: PhotoItem[];
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [user, setUser] = useState<UserSession | null>(null);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [stats, setStats] = useState({ totalUploadedPhotos: 0, selectedPhotosCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filters & selection
  const [activeTab, setActiveTab] = useState<'all' | 'selected' | 'mine'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchEventData = useCallback(async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      const eventRes = await fetch(`/api/events/${eventId}`);
      if (!eventRes.ok) {
        const errData = await eventRes.json();
        throw new Error(errData.error || 'Failed to fetch event');
      }

      const data = await eventRes.json();
      setEvent(data.event);
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message || 'Error loading event');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Admin toggles photo selection for sharing
  const togglePhotoSelection = async (photoId: string, currentSelected: boolean) => {
    if (user?.role !== 'ADMIN') return;

    try {
      const res = await fetch(`/api/events/${eventId}/photos/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds: [photoId],
          isSelected: !currentSelected,
        }),
      });

      if (res.ok) {
        setEvent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            photos: prev.photos.map((p) =>
              p.id === photoId ? { ...p, isSelected: !currentSelected } : p
            ),
          };
        });
        setStats((prev) => ({
          ...prev,
          selectedPhotosCount: currentSelected
            ? prev.selectedPhotosCount - 1
            : prev.selectedPhotosCount + 1,
        }));
      }
    } catch (err) {
      console.error('Error toggling photo selection:', err);
    }
  };

  // Batch Select / Deselect All
  const handleBatchSelect = async (selectAll: boolean) => {
    if (user?.role !== 'ADMIN' || !event) return;

    const targetPhotoIds = event.photos.map((p) => p.id);
    if (targetPhotoIds.length === 0) return;

    try {
      const res = await fetch(`/api/events/${eventId}/photos/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds: targetPhotoIds,
          isSelected: selectAll,
        }),
      });

      if (res.ok) {
        setEvent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            photos: prev.photos.map((p) => ({ ...p, isSelected: selectAll })),
          };
        });
        setStats((prev) => ({
          ...prev,
          selectedPhotosCount: selectAll ? targetPhotoIds.length : 0,
        }));
      }
    } catch (err) {
      console.error('Error batch updating selection:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-pulse mb-3">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-white">
        <Navbar user={user} />
        <div className="max-w-lg mx-auto mt-20 p-8 bg-slate-900 rounded-3xl border border-rose-500/20 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm text-slate-400 mt-2">{error || 'Event not found'}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';
  const publishedGallery = event.galleries.find((g) => g.isPublished);

  // Filter photos based on active tab
  const filteredPhotos = event.photos.filter((photo) => {
    if (activeTab === 'selected') return photo.isSelected;
    if (activeTab === 'mine') return photo.uploadedBy.id === user?.id;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-6">
          <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium truncate">{event.name}</span>
        </div>

        {/* Event Header Banner */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {event.name}
                </h1>
                {publishedGallery ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Gallery Published</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                    <span>Draft Mode</span>
                  </span>
                )}
              </div>

              {event.description && (
                <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
                  {event.description}
                </p>
              )}

              {/* Operational State Box (Section 3 & 5 of Requirements) */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    Total Uploaded:
                  </span>
                  <span className="font-bold text-white text-base">{stats.totalUploadedPhotos}</span>
                </div>
                <span className="text-slate-700">|</span>
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[10px]">
                    Selected for Publishing:
                  </span>
                  <span className="font-bold text-indigo-400 text-base">{stats.selectedPhotosCount}</span>
                </div>
                {event.eventDate && (
                  <>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </>
                )}
                <span className="text-slate-700">|</span>
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{event.members.length} Assigned Photographers</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Upload Button */}
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Photos</span>
              </button>

              {/* Admin Actions */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setIsAddMemberOpen(true)}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-2xl border border-slate-700 shadow-sm transition-all flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4 text-slate-400" />
                    <span>Invite Photographer</span>
                  </button>

                  <button
                    onClick={() => setIsPublishOpen(true)}
                    className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-violet-600/25 hover:shadow-violet-600/35 hover:-translate-y-0.5 transition-all flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{publishedGallery ? 'Update Gallery' : 'Publish Gallery'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Published Gallery Quick Access Bar */}
          {publishedGallery && (
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-indigo-950/40 p-4 rounded-2xl border border-indigo-900/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-slate-300">Customer Access URL:</span>
                <span className="font-mono text-indigo-300 select-all font-medium">
                  {typeof window !== 'undefined' ? `${window.location.origin}/gallery/${publishedGallery.slug}` : `/gallery/${publishedGallery.slug}`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/gallery/${publishedGallery.slug}`;
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-indigo-800/80 rounded-xl text-indigo-300 font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
                <Link
                  href={`/gallery/${publishedGallery.slug}`}
                  target="_blank"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview as Customer</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs & Admin Curation Bar */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All Photos ({event.photos.length})
            </button>
            <button
              onClick={() => setActiveTab('selected')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'selected'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Selected for Client ({stats.selectedPhotosCount})
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'mine'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              My Uploads
            </button>
          </div>

          {/* Admin Batch Selection Controls */}
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBatchSelect(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>Select All</span>
              </button>
              <button
                onClick={() => handleBatchSelect(false)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5 text-slate-500" />
                <span>Deselect All</span>
              </button>
            </div>
          )}
        </div>

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="mt-8 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-12 text-center">
            <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300">No photos in this view</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload photos or adjust filters to view photos.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              Upload Photos Now
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPhotos.map((photo, idx) => (
              <div
                key={photo.id}
                className={`group relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border transition-all ${
                  photo.isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.storageUrl}
                  alt={photo.filename}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                  onClick={() => setLightboxIndex(idx)}
                />

                {/* Top overlay with selection badge or toggle */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePhotoSelection(photo.id, photo.isSelected);
                      }}
                      className={`pointer-events-auto p-1.5 rounded-xl shadow-md transition-all ${
                        photo.isSelected
                          ? 'bg-indigo-600 text-white shadow-indigo-600/50 scale-105'
                          : 'bg-black/60 text-white/80 hover:bg-black/90'
                      }`}
                      title={photo.isSelected ? 'Remove from client gallery' : 'Select for client gallery'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  ) : (
                    photo.isSelected && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[10px] font-bold shadow">
                        Selected
                      </span>
                    )
                  )}

                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white/90 font-mono">
                    {(photo.fileSize / 1000000).toFixed(1)} MB
                  </span>
                </div>

                {/* Bottom caption overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between pointer-events-none">
                  <span className="text-[11px] text-white font-medium truncate max-w-[120px]">
                    {photo.uploadedBy?.name || 'Photographer'}
                  </span>
                  <button
                    onClick={() => setLightboxIndex(idx)}
                    className="pointer-events-auto text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {isUploadOpen && (
        <UploadModal
          eventId={eventId}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={fetchEventData}
        />
      )}

      {isPublishOpen && (
        <PublishGalleryModal
          eventId={eventId}
          eventName={event.name}
          existingGallery={publishedGallery}
          selectedCount={stats.selectedPhotosCount}
          isOpen={isPublishOpen}
          onClose={() => setIsPublishOpen(false)}
          onSuccess={fetchEventData}
        />
      )}

      {isAddMemberOpen && (
        <AddMemberModal
          eventId={eventId}
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          onSuccess={fetchEventData}
        />
      )}

      {/* Lightbox Viewer */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={filteredPhotos.map((p) => ({
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
