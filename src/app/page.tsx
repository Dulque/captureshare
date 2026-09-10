import Link from 'next/link';
import { Camera, ShieldCheck, Users, Lock, ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getSessionUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white">
      <Navbar user={user} />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-xs font-semibold mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TrizenAI Full-Stack Platform Challenge</span>
        </div>

        {/* Hero title */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight sm:leading-none">
          Collaborative Event Photography, <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Seamless Customer Galleries.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
          Empower photography teams to collaboratively upload high-resolution event photos. Curate, select, and publish PIN-protected client galleries without requiring customer registration.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href={user ? '/dashboard' : '/login'}
            className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
          >
            <span>{user ? 'Go to Dashboard' : 'Sign In to Demo'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            Create Account
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Role-Based Collaboration</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Admins orchestrate events and curate selections. Photographers and team members upload directly to their assigned events with strict isolation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Direct Object Storage</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              High-throughput presigned uploads directly to Cloud Object Storage (S3 / R2). Zero server bottlenecks during multi-gigabyte event uploads.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">PIN-Protected Galleries</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Clients access published event galleries with a simple 6-digit PIN and shareable link. No account creation needed. Protected by brute-force rate limiting.
            </p>
          </div>
        </div>

        {/* Demo Credentials quick access */}
        <div className="mt-16 w-full max-w-2xl bg-white/80 backdrop-blur p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-950 flex items-center justify-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Pre-Configured Demo Credentials</span>
          </h4>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-sans font-bold text-slate-800 mb-1">Admin / Lead</p>
              <p className="text-slate-600">Email: <span className="text-indigo-600 font-semibold">admin@trizen.com</span></p>
              <p className="text-slate-600">Password: <span className="text-indigo-600 font-semibold">Password123!</span></p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-sans font-bold text-slate-800 mb-1">Team Member / Photographer</p>
              <p className="text-slate-600">Email: <span className="text-emerald-600 font-semibold">photographer@trizen.com</span></p>
              <p className="text-slate-600">Password: <span className="text-emerald-600 font-semibold">Password123!</span></p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        TrizenAI Technologies — Full Stack Internship Challenge © 2026
      </footer>
    </div>
  );
}
