'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, LogOut, ShieldCheck, User as UserIcon, Sparkles } from 'lucide-react';
import { UserSession } from '@/lib/types';

interface NavbarProps {
  user?: UserSession | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all">
              <Camera className="w-5 h-5 transition-transform group-hover:rotate-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-slate-900 tracking-tight leading-none">
                Capture<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Share</span>
              </span>
              <span className="text-[10px] text-slate-600 font-medium tracking-wide uppercase mt-0.5">
                Pro Photography Platform
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {user ? (
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="hidden md:inline-flex text-xs font-semibold text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100/70 transition-colors"
                >
                  Dashboard
                </Link>

                <div className="flex items-center space-x-2 bg-slate-100/80 border border-slate-200/80 py-1.5 px-3 rounded-full shadow-xs">
                  <div className="relative flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                    {user.role === 'ADMIN' ? (
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <UserIcon className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <span className="font-semibold text-xs text-slate-800 max-w-[120px] sm:max-w-[180px] truncate">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${
                      user.role === 'ADMIN'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {user.role === 'ADMIN' ? 'Lead Admin' : 'Photographer'}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-rose-600 py-1.5 px-2.5 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Sign out of account"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-2 rounded-xl shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
