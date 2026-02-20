"use client";

import { useState } from "react";
import Link from "next/link";
import { useParentAuth } from "@/lib/parent-auth-context";
import { generateInviteCode } from "@/lib/parent-db";
import { PLAN_DETAILS } from "@/types/parent";

export default function AddChildPage() {
  const { user, parentProfile } = useParentAuth();
  const [code,       setCode]       = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const childCount  = parentProfile?.childUids?.length ?? 0;
  const plan        = parentProfile?.plan ?? "explorer";
  const maxChildren = PLAN_DETAILS[plan].maxChildren;
  const atLimit     = childCount >= maxChildren;

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    const c = await generateInviteCode(user.uid);
    setCode(c);
    setGenerating(false);
  }

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
        ← Back to overview
      </Link>

      <div>
        <h1 className="font-black text-2xl text-slate-800">Add a Child</h1>
        <p className="text-slate-500 text-sm mt-1">Link your child&apos;s FocusQuest account to your parent dashboard.</p>
      </div>

      {atLimit && (
        <div className="parent-card p-5 bg-amber-50 border-amber-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800 text-sm">Child limit reached</p>
              <p className="text-amber-600 text-xs mt-1">
                Your {plan} plan supports up to {maxChildren} child{maxChildren !== 1 ? "ren" : ""}.{" "}
                <Link href="/parent/settings" className="underline font-semibold">Upgrade your plan</Link> to link more.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="parent-card p-6">
        <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4">How it works</h2>
        <div className="space-y-4">
          {[
            { step: "1", emoji: "🔑", title: "Generate a code",     desc: "Click the button below to create a unique 6-character invite code." },
            { step: "2", emoji: "📱", title: "Share with your child",desc: "Your child opens FocusQuest → taps avatar → Link Parent Account → enters the code." },
            { step: "3", emoji: "🔗", title: "You're linked!",       desc: "Your child's activity appears in your dashboard immediately." },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl flex-shrink-0">{item.emoji}</div>
              <div>
                <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code generation */}
      <div className="parent-card p-6">
        {!code ? (
          <>
            <h2 className="font-bold text-slate-700 text-sm mb-1">Generate Invite Code</h2>
            <p className="text-slate-400 text-xs mb-5">Codes are valid for 48 hours.</p>
            <button onClick={handleGenerate} disabled={generating || atLimit}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm shadow-sm flex items-center justify-center gap-2">
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
              ) : "🔑 Generate Invite Code"}
            </button>
          </>
        ) : (
          <>
            <h2 className="font-bold text-slate-700 text-sm mb-1">Your Invite Code</h2>
            <p className="text-slate-400 text-xs mb-5">Share this with your child. Expires in 48 hours.</p>

            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center mb-4">
              <p className="text-5xl font-black tracking-[0.3em] text-slate-800 stat-number">{code}</p>
              <p className="text-slate-400 text-xs mt-2">Enter this in the FocusQuest student app</p>
            </div>

            <div className="flex gap-2">
              <button onClick={copyCode}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm shadow-sm">
                {copied ? "✓ Copied!" : "📋 Copy Code"}
              </button>
              <button onClick={() => { setCode(null); setCopied(false); }}
                className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                New Code
              </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-blue-700 text-xs font-semibold">📱 Tell your child:</p>
              <p className="text-blue-600 text-xs mt-1 leading-relaxed">
                &quot;Open FocusQuest → tap your avatar → <strong>Link Parent Account</strong> → enter code <strong>{code}</strong>&quot;
              </p>
            </div>
          </>
        )}
      </div>

      {/* Slot indicator */}
      <div className="parent-card p-4 flex items-center gap-3">
        <span className="text-xl">👨‍👩‍👧</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700">{childCount} of {maxChildren} child{maxChildren !== 1 ? "ren" : ""} linked</p>
          <p className="text-xs text-slate-400">{atLimit ? "Upgrade to link more" : `${maxChildren - childCount} slot${maxChildren - childCount !== 1 ? "s" : ""} available`}</p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: maxChildren }).map((_, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < childCount ? "bg-emerald-500" : "bg-slate-200"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
