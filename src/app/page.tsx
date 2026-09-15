import Link from 'next/link';
import {
  Camera,
  ShieldCheck,
  Users,
  Lock,
  ArrowRight,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Zap,
  KeyRound,
  Layers,
  CloudUpload
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { getSessionUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient Glow Background Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-violet-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 -left-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 -right-48 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <Navbar user={user} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Release / Challenge Badge */}
        <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-lg shadow-indigo-900/10 text-xs font-semibold mb-8 backdrop-blur-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300">TrizenAI Full-Stack Platform Challenge</span>
          <span className="text-indigo-400 font-mono text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            v1.0 Production Ready
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] text-white">
          Collaborative Event Photography, <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
            Seamless Customer Galleries.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed">
          Empower photography teams to collaboratively upload high-resolution event photos directly to cloud object storage. Curate, select, and publish PIN-protected client galleries without requiring customer registration.
        </p>

        {/* Hero Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href={user ? '/dashboard' : '/login'}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2.5 text-sm"
          >
            <span>{user ? 'Open Dashboard' : 'Sign In to Demo Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/gallery/abc123"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-2xl border border-slate-700/80 hover:border-slate-600 shadow-lg backdrop-blur-md transition-all flex items-center justify-center space-x-2 text-sm group"
          >
            <KeyRound className="w-4 h-4 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>Try Public Gallery (PIN: 482917)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>

        {/* Live Architecture Highlights Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm flex flex-col items-center">
            <CloudUpload className="w-5 h-5 text-indigo-400 mb-2" />
            <span className="text-xs font-bold text-slate-200">Presigned Uploads</span>
            <span className="text-[11px] text-slate-600 mt-0.5">S3 / R2 Direct PUTs</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm flex flex-col items-center">
            <Users className="w-5 h-5 text-emerald-400 mb-2" />
            <span className="text-xs font-bold text-slate-200">Multi-Tenant Isolation</span>
            <span className="text-[11px] text-slate-600 mt-0.5">Role-Based Access</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm flex flex-col items-center">
            <Lock className="w-5 h-5 text-violet-400 mb-2" />
            <span className="text-xs font-bold text-slate-200">Bcrypt PIN Security</span>
            <span className="text-[11px] text-slate-600 mt-0.5">Salted Hashes Only</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm flex flex-col items-center">
            <Zap className="w-5 h-5 text-amber-400 mb-2" />
            <span className="text-xs font-bold text-slate-200">Brute-Force Shield</span>
            <span className="text-[11px] text-slate-600 mt-0.5">Rate-Limited Access</span>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="relative group p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Role-Based Collaboration</h3>
            <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
              Admins create events, assign team members, and curate selections. Photographers upload directly with strict data isolation—never seeing unassigned events or other photographers&apos; unselected files.
            </p>
          </div>

          <div className="relative group p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Zero-Overhead Cloud Storage</h3>
            <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
              High-throughput presigned uploads directly to Cloud Object Storage (S3 / R2). Binary files never pass through application servers, preventing server bottlenecks during massive gigabyte batch uploads.
            </p>
          </div>

          <div className="relative group p-8 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 shadow-xl transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">PIN-Protected Client Portals</h3>
            <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
              Customers unlock their event highlights via a clean shareable URL and 6-digit PIN. Zero account signups required. Includes automated brute-force lockouts and scoped session tokens.
            </p>
          </div>
        </div>

        {/* Demo Credentials Quick-Access Card */}
        <div className="mt-16 w-full max-w-3xl bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Evaluation Demo Credentials
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Pre-seeded in SQLite / PostgreSQL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {/* Admin Box */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/90 hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-300">Lead Admin Account</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">ADMIN</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Email: <span className="text-slate-200">admin@captureshare.com</span></p>
              <p className="text-xs text-slate-400 font-mono mt-1">Password: <span className="text-slate-200">Password123!</span></p>
            </div>

            {/* Photographer Box */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/90 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-300">Team Member Account</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">TEAM_MEMBER</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Email: <span className="text-slate-200">photographer@captureshare.com</span></p>
              <p className="text-xs text-slate-400 font-mono mt-1">Password: <span className="text-slate-200">Password123!</span></p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800/80 gap-3">
            <span className="text-xs text-slate-400">
              One-click autofill is enabled on the Sign In page.
            </span>
            <Link
              href="/login"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 group"
            >
              <span>Go to Sign In Page</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CaptureShare Platform. Built for the TrizenAI Full-Stack Internship Challenge.</p>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">Register</Link>
            <Link href="/gallery/abc123" className="hover:text-slate-300 transition-colors">Demo Client Gallery</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
