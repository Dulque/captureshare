'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Plus,
  ArrowRight,
  Camera,
  Users,
  Image as ImageIcon,
  Share2,
  ShieldAlert,
  Loader2,
  FolderOpen,
  Sparkles,
  Zap,
  Lock,
  ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { UserSession } from '@/lib/types';

interface EventItem {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  createdAt: string;
  admin: { name: string; email: string };
  members: Array<{ user: { id: string; name: string; email: string } }>;
  galleries?: Array<{ id: string; title: string; slug: string; isPublished: boolean }>;
  _count?: { photos: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // New Event Form State
  const [eventName, setEventName] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch current user
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);

      // 2. Fetch events
      const eventsRes = await fetch('/api/events');
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eventName.trim(),
          description: eventDesc.trim() || undefined,
          eventDate: eventDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      setEventName('');
      setEventDesc('');
      setEventDate('');
      setIsCreatingEvent(false);
      fetchDashboardData();
    } catch (err: any) {
      setCreateError(err.message || 'Error creating event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPhotosAcrossEvents = events.reduce((acc, curr) => acc + (curr._count?.photos || 0), 0);
  const totalPublishedGalleries = events.filter((evt) => evt.galleries?.some((g) => g.isPublished)).length;

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-violet-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Workspace
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                {user?.role === 'ADMIN' ? 'Lead Admin Console' : 'Assigned Photographer'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mt-1">
              {user?.role === 'ADMIN' ? 'Event Photography Console' : 'Assigned Events'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-2xl">
              {user?.role === 'ADMIN'
                ? 'Manage collaborative events, assign team photographers, curate client selections, and publish PIN-locked galleries.'
                : 'View assigned photography events and upload high-resolution photos directly to cloud storage.'}
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsCreatingEvent(true)}
              className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          )}
        </div>

        {/* Live Operational Metrics Cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Total Events</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{events.length}</span>
              <span className="text-[10px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Active
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Total Photos</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalPhotosAcrossEvents}</span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                In Cloud
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Published Galleries</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalPublishedGalleries}</span>
              <span className="text-[10px] text-violet-400 font-mono bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                PIN Protected
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl border border-slate-800 shadow-xl">
            <span className="text-xs font-semibold text-slate-400">Storage Engine</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-sm font-bold text-white">S3 / R2 Direct</span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Presigned PUT
              </span>
            </div>
          </div>
        </div>

        {/* Create Event Modal */}
        {isCreatingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-3xl max-w-md w-full p-7 shadow-2xl border border-slate-800 text-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Create Photography Event</h2>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Set up an event container to invite team photographers and curate photos.
              </p>

              {createError && (
                <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Arjun & Priya Wedding"
                    required
                    className="w-full px-4 py-2.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Ceremony notes, venue details, client preferences..."
                    className="w-full px-4 py-2.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreatingEvent(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !eventName.trim()}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Event</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <span>{user?.role === 'ADMIN' ? `Managed Events (${events.length})` : `Assigned Events (${events.length})`}</span>
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-12 text-center max-w-lg mx-auto mt-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No events found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                {user?.role === 'ADMIN'
                  ? 'Click "Create New Event" above to create your first event container and assign photographers.'
                  : 'You have not been assigned to any events yet. Contact your Lead Admin to get assigned.'}
              </p>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setIsCreatingEvent(true)}
                  className="mt-6 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all inline-flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Event</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => {
                const liveGallery = evt.galleries?.find((g) => g.isPublished);

                return (
                  <div
                    key={evt.id}
                    className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 hover:border-indigo-500/40 p-6 shadow-xl hover:shadow-indigo-500/5 transition-all hover:-translate-y-1 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Row: Icon & Status Badge */}
                      <div className="flex items-start justify-between">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>

                        {liveGallery ? (
                          <Link
                            href={`/gallery/${liveGallery.slug}`}
                            target="_blank"
                            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Client Live</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                            <span>Unpublished</span>
                          </span>
                        )}
                      </div>

                      {/* Event Title */}
                      <h3 className="mt-5 text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {evt.name}
                      </h3>

                      {evt.description && (
                        <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      )}

                      {/* Metadata Grid */}
                      <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2.5 text-xs text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{evt._count?.photos || 0} Photos</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{evt.members?.length || 0} Photographers</span>
                        </div>
                        {evt.eventDate && (
                          <div className="col-span-2 flex items-center space-x-1.5 text-slate-400 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(evt.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        Lead: {evt.admin?.name}
                      </span>
                      <Link
                        href={`/events/${evt.id}`}
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors py-1 px-2.5 rounded-lg hover:bg-indigo-500/10"
                      >
                        <span>Manage Event</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
