"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParentAuth } from "@/lib/parent-auth-context";
import { updateParentProfile } from "@/lib/parent-db";
import { PLAN_DETAILS, type PlanTier } from "@/types/parent";
import { cn } from "@/lib/utils";

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  explorer:   ["1 child", "Weekly draw only", "Basic dashboard", "Free forever"],
  adventurer: ["Up to 2 children", "All prize draws", "Full insights", "$8.99/month"],
  champion:   ["Up to 4 children", "All draws + Seasonal", "Family report emails", "$14.99/month"],
};

export default function ParentSettingsPage() {
  const { user, parentProfile, logOut, refreshProfile } = useParentAuth();
  const router = useRouter();
  const [notif,   setNotif]   = useState(parentProfile?.notificationsEnabled ?? true);
  const [weekly,  setWeekly]  = useState(parentProfile?.weeklyReportEnabled ?? true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    await updateParentProfile(user.uid, { notificationsEnabled: notif, weeklyReportEnabled: weekly });
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  const plan = parentProfile?.plan ?? "explorer";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="font-black text-2xl text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account and preferences.</p>
      </div>

      {/* Account */}
      <div className="parent-card p-6">
        <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4">Account</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl">
            {(parentProfile?.displayName ?? "P")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{parentProfile?.displayName}</p>
            <p className="text-slate-500 text-sm">{parentProfile?.email}</p>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <button onClick={() => logOut().then(() => router.push("/parent/login"))}
            className="text-red-500 hover:text-red-700 text-sm font-semibold transition-colors flex items-center gap-2">
            <span>⎋</span> Sign out
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="parent-card p-6">
        <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4">Subscription Plan</h2>
        <div className="space-y-3">
          {(Object.entries(PLAN_DETAILS) as [PlanTier, (typeof PLAN_DETAILS)[PlanTier]][]).map(([key, info]) => (
            <div key={key} className={cn(
              "rounded-xl border-2 p-4 transition-all",
              plan === key ? "border-emerald-400 bg-emerald-50" : "border-slate-100 bg-white"
            )}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.badge}</span>
                  <span className={cn("font-black text-sm", plan === key ? "text-emerald-800" : "text-slate-700")}>{info.label}</span>
                  {plan === key && <span className="text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <span className={cn("font-bold text-sm", plan === key ? "text-emerald-700" : "text-slate-500")}>{info.price}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {PLAN_FEATURES[key].map(f => (
                  <span key={f} className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> {f}
                  </span>
                ))}
              </div>
              {plan !== key && key !== "explorer" && (
                <button className="mt-3 w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-lg transition-all active:scale-95">
                  Upgrade to {info.label}
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">Subscriptions managed via Stripe. No contracts — cancel anytime.</p>
      </div>

      {/* Notifications */}
      <div className="parent-card p-6">
        <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4">Notifications</h2>
        <div className="space-y-4">
          <Toggle label="Activity notifications" desc="Get notified when your child completes focus sessions" value={notif} onChange={setNotif} />
          <Toggle label="Weekly family report" desc="Receive a Sunday summary email of the week's effort" value={weekly} onChange={setWeekly} />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 text-sm shadow-sm">
          {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Preferences"}
        </button>
      </div>

      {/* Privacy */}
      <div className="parent-card p-6">
        <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4">Privacy & Data</h2>
        <div className="space-y-3">
          {[
            { emoji: "🛡️", label: "What we collect", desc: "Only focus session times and durations. No screen content, keystrokes, or location." },
            { emoji: "🚫", label: "What we never do", desc: "We never sell data, run ads, or share information with third parties." },
            { emoji: "🗑️", label: "Data deletion",    desc: "Request deletion of all your family's data within 30 days of cancellation." },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <span className="text-base mt-0.5">{item.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button className="text-xs text-slate-500 hover:text-slate-700 underline">Privacy Policy</button>
          <button className="text-xs text-slate-500 hover:text-slate-700 underline">Terms of Service</button>
          <button className="text-xs text-red-500 hover:text-red-700 underline">Request Data Deletion</button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-300">FocusQuest Parent Portal v1.0</p>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!value)}
        className={cn("relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 mt-0.5",
          value ? "bg-emerald-500" : "bg-slate-200")}>
        <div className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200",
          value ? "left-5" : "left-0.5")} />
      </button>
    </div>
  );
}
