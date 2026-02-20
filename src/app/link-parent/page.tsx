"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { redeemInviteCode } from "@/lib/parent-db";
import { cn } from "@/lib/utils";

export default function LinkParentPage() {
  const { user, profile } = useAuth();
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) { setError("Please enter the full 6-character code."); return; }
    if (!user) return;
    setLoading(true); setError("");
    const result = await redeemInviteCode(clean, user.uid);
    setLoading(false);
    if (result.success) setSuccess(true);
    else setError(result.error ?? "Something went wrong.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-quest-50 via-white to-indigo-50">
      <div className="w-full max-w-sm">
        <Link href="/dashboard" className="text-quest-600 text-sm font-medium flex items-center gap-1 mb-6 hover:underline">
          ← Back to Dashboard
        </Link>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔗</div>
          <h1 className="text-2xl font-black text-quest-800">Link Parent Account</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter the code your parent generated in their FocusQuest dashboard.
          </p>
        </div>

        {success ? (
          <div className="card text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="font-black text-xl text-quest-800 mb-2">Linked!</h2>
            <p className="text-slate-500 text-sm mb-5">
              Your parent can now see your focus progress and give you Effort Boost entries.
            </p>
            <Link href="/dashboard" className="btn-primary block w-full">Back to Dashboard</Link>
          </div>
        ) : (
          <div className="card">
            {(profile as { parentUid?: string })?.parentUid && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-blue-700 text-sm font-semibold">ℹ️ Already linked to a parent.</p>
                <p className="text-blue-500 text-xs mt-0.5">Entering a new code will switch to the new parent.</p>
              </div>
            )}

            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Invite Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))}
                  className="input-field text-center text-3xl font-black tracking-[0.4em] uppercase"
                  placeholder="XXXXXX"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-slate-400 text-center mt-1">6 characters · letters and numbers</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
              )}

              <button type="submit" disabled={loading || code.length !== 6} className="btn-primary w-full">
                {loading ? "Linking…" : "Link to Parent Account 🔗"}
              </button>
            </form>

            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold mb-1.5">What your parent can see:</p>
              <div className="space-y-1">
                {[
                  ["✓", "Your focus session durations"],
                  ["✓", "Effort boost entries they give you"],
                  ["✗", "Your mood check-ins (private)"],
                  ["✗", "Your screen or device activity"],
                ].map(([icon, text]) => (
                  <p key={text} className={cn("text-xs flex items-center gap-1.5",
                    icon === "✓" ? "text-emerald-600" : "text-slate-400")}>
                    <span>{icon}</span> {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
