"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParentAuth } from "@/lib/parent-auth-context";

export default function ParentLoginPage() {
  const { signIn, signInWithGoogle } = useParentAuth();
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signIn(email, password);
      router.push("/parent/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(friendlyError(code));
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError(""); setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/parent/dashboard");
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "DM Sans, sans-serif", background: "#f8f9fb" }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex w-96 flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg, #065f46 0%, #047857 50%, #059669 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎯</div>
          <span className="text-white font-black text-lg tracking-tight">FocusQuest</span>
        </div>
        <div>
          <h2 className="text-white font-black text-3xl leading-tight mb-4">
            Your child&apos;s focus journey,<br/>at a glance.
          </h2>
          <p className="text-emerald-200 text-sm leading-relaxed mb-10">
            Monitor effort, give encouragement boosts, and watch your child build lasting study habits — without surveillance.
          </p>
          <div className="space-y-3">
            {[
              { emoji: "📊", text: "Real-time focus session tracking" },
              { emoji: "⭐", text: "Give effort boosts as rewards" },
              { emoji: "🛡️", text: "No screen monitoring, ever" },
              { emoji: "🔒", text: "Full data privacy & control" },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">{f.emoji}</div>
                <span className="text-emerald-100 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-300 text-xs">© 2026 FocusQuest · Privacy-first by design</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-sm">🎯</div>
              <span className="font-black text-slate-800">FocusQuest</span>
            </div>
            <h1 className="font-black text-2xl text-slate-800">Parent sign in</h1>
            <p className="text-slate-500 text-sm mt-1">Access your family dashboard</p>
          </div>

          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl py-3 px-4 font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm mb-5 text-sm">
            <GoogleIcon />
            Continue with Google
          </button>

          <Divider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white text-sm"
                placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white text-sm"
                placeholder="••••••••" required />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm shadow-sm">
              {loading ? "Signing in…" : "Sign In to Dashboard"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New parent?{" "}
            <Link href="/parent/signup" className="text-emerald-600 font-bold hover:underline">Create account</Link>
          </p>
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <Link href="/auth/login" className="text-xs text-slate-400 hover:underline">Student login →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function friendlyError(code: string) {
  const map: Record<string, string> = {
    "auth/user-not-found":    "No account found with this email.",
    "auth/wrong-password":    "Incorrect password.",
    "auth/invalid-credential":"Email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Please wait.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">or email</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}
