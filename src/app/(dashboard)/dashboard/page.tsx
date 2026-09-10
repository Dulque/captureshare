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
  FolderOpen
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {user?.role === 'ADMIN' ? 'Admin Photography Console' : 'Team Workspace'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {user?.role === 'ADMIN'
                ? 'Manage events, review uploaded photos, and publish PIN-protected client galleries.'
                : 'View assigned photography events and upload high-resolution photos.'}
            </p>
          </div>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setIsCreatingEvent(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Event</span>
            </button>
          )}
        </div>

        {/* Create Event Modal */}
        {isCreatingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create New Event</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set up an event to invite team photographers and collect photos
              </p>

              {createError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Arjun & Priya Wedding"
                    required
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Grand ballroom, reception ceremony..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreatingEvent(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !eventName.trim()}
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Create Event</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events Grid */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              {user?.role === 'ADMIN' ? `All Managed Events (${events.length})` : `Assigned Events (${events.length})`}
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto mt-6">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No events found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {user?.role === 'ADMIN'
                  ? 'Click "Create New Event" to set up your first photography event and invite photographers.'
                  : 'You have not been assigned to any events yet. Contact your Admin to get invited.'}
              </p>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => setIsCreatingEvent(true)}
                  className="mt-5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Event</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Camera className="w-5 h-5" />
                      </div>
                      {evt.galleries && evt.galleries.length > 0 && evt.galleries[0].isPublished && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60">
                          <Share2 className="w-3 h-3" />
                          <span>Gallery Live</span>
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {evt.name}
                    </h3>

                    {evt.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt._count?.photos || 0} Photos</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{evt.members?.length || 0} Members</span>
                      </div>
                      {evt.eventDate && (
                        <div className="col-span-2 flex items-center space-x-1.5 text-slate-400 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(evt.eventDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Created by {evt.admin?.name}
                    </span>
                    <Link
                      href={`/events/${evt.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Open Event</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
