"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParentAuth } from "@/lib/parent-auth-context";

export default function ParentSignupPage() {
  const { signUp, signInWithGoogle } = useParentAuth();
  const router = useRouter();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [agreed,  setAgreed]  = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please accept the terms to continue."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    try {
      await signUp(email, password, name);
      router.push("/parent/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message ?? "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    if (!agreed) { setError("Please accept the terms to continue."); return; }
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/parent/dashboard");
    } catch {
      setError("Google sign-in failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ fontFamily: "DM Sans, sans-serif", background: "#f8f9fb" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-lg">🎯</div>
            <span className="font-black text-slate-800 text-xl">FocusQuest</span>
          </div>
          <h1 className="font-black text-2xl text-slate-800">Create parent account</h1>
          <p className="text-slate-500 text-sm mt-1">Free to start · No credit card required</p>
        </div>

        <div className="parent-card p-8">
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 shadow-sm mb-5 text-sm">
            <GoogleIcon /> Sign up with Google
          </button>
          <Divider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Your Name">
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="parent-input" placeholder="Jane Smith" required />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="parent-input" placeholder="you@example.com" required />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="parent-input" placeholder="At least 6 characters" required minLength={6} />
            </Field>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-emerald-600" />
              <span className="text-xs text-slate-500 leading-relaxed">
                I confirm I am 18 or older and I accept the{" "}
                <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>.
                I understand FocusQuest does not monitor child screen activity.
              </span>
            </label>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">{error}</div>}

            <button type="submit" disabled={loading || !agreed}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm shadow-sm">
              {loading ? "Creating account…" : "Create Parent Account →"}
            </button>
          </form>

          <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-600 mb-2">Free Explorer plan includes:</p>
            {["1 child profile", "Weekly Prize Draw access", "Basic progress dashboard"].map(f => (
              <p key={f} className="text-xs text-slate-500 flex items-center gap-1.5"><span className="text-emerald-500">✓</span>{f}</p>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/parent/login" className="text-emerald-600 font-bold hover:underline">Sign in</Link>
        </p>
      </div>

      <style jsx>{`
        .parent-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          outline: none;
          font-size: 0.875rem;
          color: #1e293b;
          background: white;
        }
        .parent-input:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
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
