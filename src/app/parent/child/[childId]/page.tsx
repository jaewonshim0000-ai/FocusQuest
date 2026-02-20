"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useParentAuth } from "@/lib/parent-auth-context";
import {
  getChildSessions, getChildSessionsLast7Days, getChildEntries,
  getBoostHistory, getBoostsThisWeek, giveEffortBoost,
  buildWeeklyChartData, unlinkChild, getChildrenProfiles,
} from "@/lib/parent-db";
import { AVATARS, ENTRY_REASON_LABELS, FOCUS_QUALITY_OPTIONS, type StudentProfile, type FocusSession, type PrizeEntry } from "@/types";
import type { ParentBoost } from "@/types/parent";
import { formatMinutes, getToday } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "overview" | "sessions" | "entries" | "boosts";

export default function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const { user }    = useParentAuth();
  const router      = useRouter();

  const [profile,     setProfile]     = useState<StudentProfile | null>(null);
  const [sessions7,   setSessions7]   = useState<FocusSession[]>([]);
  const [allSessions, setAllSessions] = useState<FocusSession[]>([]);
  const [entries,     setEntries]     = useState<PrizeEntry[]>([]);
  const [boostHist,   setBoostHist]   = useState<ParentBoost[]>([]);
  const [boostsUsed,  setBoostsUsed]  = useState(0);
  const [tab,         setTab]         = useState<Tab>("overview");
  const [loading,     setLoading]     = useState(true);

  // Boost modal
  const [showBoost,   setShowBoost]   = useState(false);
  const [boostCount,  setBoostCount]  = useState<1|2|3>(1);
  const [boostNote,   setBoostNote]   = useState("");
  const [boostSaving, setBoostSaving] = useState(false);
  const [boostDone,   setBoostDone]   = useState(false);
  const [boostErr,    setBoostErr]    = useState("");

  // Unlink confirm
  const [showUnlink, setShowUnlink] = useState(false);

  useEffect(() => {
    if (!user || !childId) return;
    async function load() {
      const [profiles, s7, sess, ents, boosts, bUsed] = await Promise.all([
        getChildrenProfiles([childId]),
        getChildSessionsLast7Days(childId),
        getChildSessions(childId, 30),
        getChildEntries(childId),
        getBoostHistory(user!.uid, childId),
        getBoostsThisWeek(user!.uid, childId),
      ]);
      setProfile(profiles[0] ?? null);
      setSessions7(s7); setAllSessions(sess);
      setEntries(ents); setBoostHist(boosts); setBoostsUsed(bUsed);
      setLoading(false);
    }
    load();
  }, [user, childId]);

  async function handleBoost() {
    if (!user) return;
    setBoostSaving(true); setBoostErr("");
    const r = await giveEffortBoost(user.uid, childId, boostCount, boostNote);
    setBoostSaving(false);
    if (r.success) {
      setBoostDone(true);
      setBoostsUsed(b => b + 1);
      setTimeout(() => { setShowBoost(false); setBoostDone(false); setBoostNote(""); setBoostCount(1); }, 1800);
    } else { setBoostErr(r.error ?? "Something went wrong."); }
  }

  async function handleUnlink() {
    if (!user) return;
    await unlinkChild(user.uid, childId);
    router.push("/parent/dashboard");
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-16">
      <p className="text-slate-500">Child not found.</p>
      <Link href="/parent/dashboard" className="text-emerald-600 text-sm font-semibold mt-2 block hover:underline">← Back</Link>
    </div>
  );

  const avatar       = AVATARS.find(a => a.id === profile.avatarId) ?? AVATARS[0];
  const chartData    = buildWeeklyChartData(sessions7);
  const maxMins      = Math.max(...chartData.map(d => d.minutes), 1);
  const today        = getToday();
  const todayMins    = sessions7.filter(s => s.date === today).reduce((s, sess) => s + sess.durationMinutes, 0);
  const weekMins     = sessions7.reduce((s, sess) => s + sess.durationMinutes, 0);

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview"  },
    { key: "sessions", label: "Sessions"  },
    { key: "entries",  label: "Entries"   },
    { key: "boosts",   label: "Boosts"    },
  ];

  return (
    <div className="space-y-6">
      <Link href="/parent/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium">
        ← Back to overview
      </Link>

      {/* Child header */}
      <div className="parent-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${avatar.color}18` }}>
            {avatar.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-2xl text-slate-800">{profile.displayName}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {(profile.currentStreak ?? 0) > 0 && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                  🔥 {profile.currentStreak}-day streak
                </span>
              )}
              <span className="text-xs text-slate-400">Longest: {profile.longestStreak ?? 0} days</span>
            </div>
          </div>
          <button onClick={() => setShowBoost(true)} disabled={boostsUsed >= 2}
            className={cn(
              "flex flex-col items-center gap-1 px-5 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm",
              boostsUsed >= 2 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-amber-400 hover:bg-amber-500 text-white"
            )}>
            <span className="text-xl">⭐</span>
            <span>{boostsUsed >= 2 ? "Used" : "Boost"}</span>
            <span className="text-xs opacity-75">{2 - boostsUsed} left</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: "Today",       value: formatMinutes(todayMins),              emoji: "📅" },
            { label: "This week",   value: formatMinutes(weekMins),               emoji: "📊" },
            { label: "Total focus", value: formatMinutes(profile.totalFocusMinutes ?? 0), emoji: "⏱️" },
            { label: "Total entries",value: String(profile.totalEntries ?? 0),   emoji: "🎟️" },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <p className="text-base mb-0.5">{s.emoji}</p>
              <p className="stat-number font-black text-slate-800 text-base">{s.value}</p>
              <p className="text-xs text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === t.key ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="space-y-4 stagger">
          {/* Bar chart */}
          <div className="parent-card p-5">
            <h3 className="font-bold text-slate-700 text-sm mb-4">Focus Minutes — Last 7 Days</h3>
            <div className="flex items-end gap-2 h-28">
              {chartData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={cn("w-full rounded-t-lg activity-bar group relative",
                    day.minutes > 0 ? "bg-emerald-400 hover:bg-emerald-500" : "bg-slate-100")}
                    style={{ height: `${Math.max(4, (day.minutes / maxMins) * 100)}px` }}
                    title={`${day.minutes}m`} />
                  <span className="text-xs text-slate-400 font-medium">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus quality */}
          <div className="parent-card p-5">
            <h3 className="font-bold text-slate-700 text-sm mb-3">Focus Quality (last 7 days)</h3>
            {sessions7.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No sessions this week yet.</p>
            ) : (
              <div className="space-y-2">
                {FOCUS_QUALITY_OPTIONS.map(opt => {
                  const count = sessions7.filter(s => s.focusQuality === opt.value).length;
                  const pct   = Math.round((count / sessions7.length) * 100);
                  return (
                    <div key={opt.value} className="flex items-center gap-3">
                      <span className="text-base w-6">{opt.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                          <span>{opt.label}</span>
                          <span>{count} session{count !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-1.5">
                          <div className={cn("h-full rounded-full transition-all duration-500",
                            opt.value === "fully_focused" ? "bg-emerald-500" :
                            opt.value === "mostly_focused" ? "bg-blue-400" : "bg-slate-400")}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Milestones */}
          <div className="parent-card p-5">
            <h3 className="font-bold text-slate-700 text-sm mb-3">Milestones</h3>
            {[
              { emoji: "🔥", label: "Current streak",       value: `${profile.currentStreak ?? 0} days`,  hi: (profile.currentStreak ?? 0) > 0 },
              { emoji: "🏆", label: "Longest streak ever",  value: `${profile.longestStreak ?? 0} days`,  hi: false },
              { emoji: "⏱️", label: "Total focus time",     value: formatMinutes(profile.totalFocusMinutes ?? 0), hi: false },
              { emoji: "🎟️", label: "Total entries earned", value: String(profile.totalEntries ?? 0),     hi: false },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{m.emoji}</span>
                  <span className="text-sm text-slate-600 font-medium">{m.label}</span>
                </div>
                <span className={cn("font-bold text-sm stat-number", m.hi ? "text-emerald-600" : "text-slate-700")}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Unlink */}
          <div className="parent-card p-4 border-red-100">
            <button onClick={() => setShowUnlink(true)}
              className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-2 transition-colors">
              ⊘ Unlink {profile.displayName}&apos;s account
            </button>
          </div>
        </div>
      )}

      {/* Sessions tab */}
      {tab === "sessions" && (
        <div className="parent-card divide-y divide-slate-50">
          {allSessions.length === 0 ? (
            <div className="p-8 text-center"><p className="text-3xl mb-2">⏱️</p><p className="text-slate-500 text-sm">No sessions yet.</p></div>
          ) : allSessions.map(sess => {
            const q = FOCUS_QUALITY_OPTIONS.find(q => q.value === sess.focusQuality);
            return (
              <div key={sess.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0">
                  {sess.durationMinutes >= 50 ? "🔥" : "⏱️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{sess.durationMinutes}-min focus session</p>
                  <p className="text-slate-400 text-xs">{sess.date} · {q?.emoji} {q?.label}</p>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex-shrink-0">
                  +{sess.entriesEarned} 🎟️
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Entries tab */}
      {tab === "entries" && (
        <div className="parent-card divide-y divide-slate-50">
          {entries.length === 0 ? (
            <div className="p-8 text-center"><p className="text-3xl mb-2">🎟️</p><p className="text-slate-500 text-sm">No entries yet.</p></div>
          ) : entries.map(entry => {
            const meta = ENTRY_REASON_LABELS[entry.reason];
            return (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xl">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 text-sm">{meta.label}</p>
                  <p className="text-slate-400 text-xs">{entry.date}</p>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg flex-shrink-0">
                  +{entry.count} 🎟️
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Boosts tab */}
      {tab === "boosts" && (
        <div className="space-y-4">
          <div className="parent-card p-5 bg-amber-50 border-amber-100">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⭐</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">Effort Boost</p>
                <p className="text-amber-600 text-xs mt-1 leading-relaxed">
                  Recognize exceptional effort with 1–3 bonus prize entries. Max 2 per week per child.
                </p>
              </div>
            </div>
            <button onClick={() => setShowBoost(true)} disabled={boostsUsed >= 2}
              className={cn("mt-4 w-full font-bold py-2.5 px-4 rounded-xl text-sm transition-all active:scale-95",
                boostsUsed >= 2 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-amber-400 hover:bg-amber-500 text-white shadow-sm")}>
              {boostsUsed >= 2 ? "Max boosts used this week" : `Give Effort Boost (${2 - boostsUsed} remaining)`}
            </button>
          </div>

          <div className="parent-card divide-y divide-slate-50">
            <div className="px-5 py-3 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Boost History</p>
            </div>
            {boostHist.length === 0 ? (
              <div className="p-8 text-center"><p className="text-3xl mb-2">⭐</p><p className="text-slate-400 text-sm">No boosts given yet.</p></div>
            ) : boostHist.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">⭐</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 text-sm">
                    +{b.count} entries{b.note && <span className="text-slate-400 font-normal"> · &quot;{b.note}&quot;</span>}
                  </p>
                  <p className="text-slate-400 text-xs">{b.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boost modal */}
      {showBoost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end lg:items-center justify-center p-4"
          onClick={() => !boostSaving && setShowBoost(false)}>
          <div className="parent-card w-full max-w-sm p-6 slide-in-right" onClick={e => e.stopPropagation()}>
            {boostDone ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">⭐</div>
                <p className="font-black text-xl text-slate-800">Boost sent!</p>
                <p className="text-slate-500 text-sm mt-1">+{boostCount} entries added to {profile.displayName}&apos;s balance</p>
              </div>
            ) : (
              <>
                <h3 className="font-black text-lg text-slate-800 mb-1">Give Effort Boost</h3>
                <p className="text-slate-500 text-sm mb-5">Recognize {profile.displayName}&apos;s hard work.</p>

                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Entries to award</p>
                <div className="flex gap-2 mb-4">
                  {([1,2,3] as const).map(n => (
                    <button key={n} onClick={() => setBoostCount(n)}
                      className={cn("flex-1 py-3 rounded-xl border-2 font-black text-lg transition-all",
                        boostCount === n ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-400 hover:border-slate-300")}>
                      {n}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Note (optional)</p>
                <input type="text" value={boostNote} onChange={e => setBoostNote(e.target.value)} maxLength={80}
                  placeholder="e.g. Great job finishing that essay!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm text-slate-800 placeholder-slate-400 mb-4" />

                {boostErr && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs mb-4">{boostErr}</div>}

                <div className="flex gap-2">
                  <button onClick={() => setShowBoost(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={handleBoost} disabled={boostSaving}
                    className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-sm">
                    {boostSaving ? "Sending…" : `Give +${boostCount} ⭐`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unlink modal */}
      {showUnlink && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowUnlink(false)}>
          <div className="parent-card w-full max-w-xs p-6" onClick={e => e.stopPropagation()}>
            <p className="text-3xl mb-3 text-center">⚠️</p>
            <h3 className="font-black text-slate-800 text-center mb-2">Unlink account?</h3>
            <p className="text-slate-500 text-sm text-center mb-5">
              You&apos;ll no longer see {profile.displayName}&apos;s activity. Their account and data won&apos;t be deleted.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowUnlink(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm">Cancel</button>
              <button onClick={handleUnlink}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm">Unlink</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
