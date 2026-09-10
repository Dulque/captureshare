'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
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
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Camera className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">
                Trizen<span className="text-indigo-600">Share</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-full text-sm">
                  {user.role === 'ADMIN' ? (
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className="font-medium text-gray-800">{user.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      user.role === 'ADMIN'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {user.role === 'ADMIN' ? 'Admin' : 'Team Member'}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-red-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-red-50"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
