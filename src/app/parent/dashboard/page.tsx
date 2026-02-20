"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParentAuth } from "@/lib/parent-auth-context";
import {
  getLinkedChildren, getChildrenProfiles, getPrizePoolHealth,
  getChildSessionsLast7Days, getBoostsThisWeek, buildWeeklyChartData,
} from "@/lib/parent-db";
import { PLAN_DETAILS, POOL_HEALTH_LABELS, type PrizePoolHealth } from "@/types/parent";
import { AVATARS, type StudentProfile, type FocusSession } from "@/types";
import { formatMinutes, getToday } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ChildData { profile: StudentProfile; sessions: FocusSession[]; boostsUsed: number; }

export default function ParentDashboardPage() {
  const { user, parentProfile } = useParentAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [pool,     setPool]     = useState<PrizePoolHealth | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user || !parentProfile) return;
    async function load() {
      const [links, poolHealth] = await Promise.all([
        getLinkedChildren(user!.uid),
        getPrizePoolHealth(),
      ]);
      const profiles = await getChildrenProfiles(links.map(l => l.childUid));
      const childData = await Promise.all(profiles.map(async p => {
        const [sessions, boostsUsed] = await Promise.all([
          getChildSessionsLast7Days(p.uid),
          getBoostsThisWeek(user!.uid, p.uid),
        ]);
        return { profile: p, sessions, boostsUsed };
      }));
      setChildren(childData);
      setPool(poolHealth as PrizePoolHealth);
      setLoading(false);
    }
    load();
  }, [user, parentProfile]);

  const plan     = parentProfile?.plan ?? "explorer";
  const planInfo = PLAN_DETAILS[plan];
  const today    = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const totalToday   = children.reduce((sum, c) => sum + c.sessions.filter(s => s.date === getToday()).reduce((s, sess) => s + sess.durationMinutes, 0), 0);
  const totalEntries = children.reduce((sum, c) => sum + (c.profile.currentWeekEntries ?? 0), 0);
  const totalStreak  = children.reduce((sum, c) => sum + (c.profile.currentStreak ?? 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-7 stagger">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{today}</p>
          <h1 className="font-black text-2xl text-slate-800 mt-0.5">Family Overview</h1>
        </div>
        <Link href="/parent/add-child"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-sm">
          + Add Child
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <SumCard emoji="⏱️" value={formatMinutes(totalToday)} label="Focus today" bg="bg-blue-50"   text="text-blue-700"   border="border-blue-100"   />
        <SumCard emoji="🔥" value={`${totalStreak}d`}         label="Combined streak" bg="bg-orange-50" text="text-orange-700" border="border-orange-100" />
        <SumCard emoji="🎟️" value={String(totalEntries)}      label="Entries/week" bg="bg-amber-50"  text="text-amber-700"  border="border-amber-100"  />
      </div>

      {/* No children state */}
      {children.length === 0 && (
        <div className="parent-card p-10 text-center">
          <div className="text-5xl mb-4">👨‍👩‍👧</div>
          <h3 className="font-black text-xl text-slate-700 mb-2">No children linked yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            Generate an invite code and have your child enter it in their FocusQuest app to link accounts.
          </p>
          <Link href="/parent/add-child"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm shadow-sm">
            + Add First Child
          </Link>
        </div>
      )}

      {/* Child cards */}
      {children.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Your Children</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map(c => (
              <ChildCard key={c.profile.uid} data={c} parentUid={user!.uid} />
            ))}
          </div>
        </div>
      )}

      {/* Prize pool health */}
      {pool && (
        <div>
          <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Prize Pool Status</h2>
          <PoolCard pool={pool} />
        </div>
      )}

      {/* Upgrade prompt */}
      {plan === "explorer" && children.length > 0 && (
        <div className="parent-card p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚔️</span>
            <div className="flex-1">
              <p className="font-bold text-slate-800 text-sm">Upgrade to Adventurer</p>
              <p className="text-slate-500 text-xs mt-0.5">Add a 2nd child, unlock Monthly Draws — $8.99/month</p>
            </div>
            <Link href="/parent/settings"
              className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all">
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Privacy note */}
      <div className="parent-card p-4 border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">🛡️</div>
          <div>
            <p className="text-xs font-bold text-slate-600 mb-0.5">Privacy First</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              FocusQuest never monitors your child&apos;s screen, camera, or keystrokes. You only see effort data your child generates voluntarily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SumCard({ emoji, value, label, bg, text, border }: {
  emoji: string; value: string; label: string; bg: string; text: string; border: string;
}) {
  return (
    <div className={cn("parent-card p-4 border text-center", bg, border)}>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className={cn("stat-number font-black text-xl", text)}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function ChildCard({ data, parentUid }: { data: ChildData; parentUid: string }) {
  const { profile, sessions, boostsUsed } = data;
  const avatar = AVATARS.find(a => a.id === profile.avatarId) ?? AVATARS[0];
  const today  = getToday();
  const todayMins = sessions.filter(s => s.date === today).reduce((s, sess) => s + sess.durationMinutes, 0);
  const weekMins  = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
  const bars      = buildWeeklyChartData(sessions);
  const maxMins   = Math.max(...bars.map(b => b.minutes), 1);

  return (
    <Link href={`/parent/child/${profile.uid}`} className="parent-card clickable p-5 block hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: `${avatar.color}18` }}>
          {avatar.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-800 truncate">{profile.displayName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {(profile.currentStreak ?? 0) > 0 && (
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                🔥 {profile.currentStreak}d
              </span>
            )}
          </div>
        </div>
        <span className="text-slate-300">→</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {[
          { label: "Today",     value: formatMinutes(todayMins), hi: todayMins > 0 },
          { label: "This week", value: formatMinutes(weekMins),  hi: false },
          { label: "Entries",   value: String(profile.currentWeekEntries ?? 0), hi: false },
        ].map(s => (
          <div key={s.label} className={cn("rounded-lg p-2", s.hi ? "bg-emerald-50" : "bg-slate-50")}>
            <p className={cn("stat-number font-black text-sm", s.hi ? "text-emerald-700" : "text-slate-700")}>{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mini bar chart */}
      <p className="text-xs text-slate-400 font-medium mb-1.5">7-day focus</p>
      <div className="flex items-end gap-1 h-8">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className={cn("w-full rounded-t-sm activity-bar", bar.minutes > 0 ? "bg-emerald-400" : "bg-slate-100")}
              style={{ height: `${Math.max(3, (bar.minutes / maxMins) * 28)}px` }}
            />
            <span className="text-slate-300 text-xs leading-none">{bar.label.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Boost dots */}
      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className="text-xs text-slate-400">Boosts this week</span>
        <div className="flex gap-1">
          {[0, 1].map(i => (
            <div key={i} className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs",
              i < boostsUsed ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-300")}>
              ⭐
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

function PoolCard({ pool }: { pool: PrizePoolHealth }) {
  const meta = POOL_HEALTH_LABELS[pool.status];
  const pct  = Math.min(100, Math.round((pool.coverageRatio / 5) * 100));
  return (
    <div className={cn("parent-card p-5 border", meta.bg)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full flex-shrink-0",
            pool.status === "green" ? "bg-emerald-500 pool-green" :
            pool.status === "yellow" ? "bg-amber-500" : "bg-red-500")} />
          <div>
            <p className={cn("font-bold text-sm", meta.color)}>Prize Pool: {meta.label}</p>
            <p className="text-slate-500 text-xs">{meta.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-black text-slate-800 text-lg stat-number">${pool.currentBalance.toLocaleString()}</p>
          <p className="text-slate-400 text-xs">current balance</p>
        </div>
      </div>
      <div className="bg-white/60 rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700",
          pool.status === "green" ? "bg-emerald-500" : pool.status === "yellow" ? "bg-amber-500" : "bg-red-500")}
          style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <p className="text-xs text-slate-400">Projected monthly: ${pool.projectedMonthlyDraw}</p>
        <p className="text-xs text-slate-500 font-medium">{pool.coverageRatio.toFixed(1)}× coverage</p>
      </div>
    </div>
  );
}
