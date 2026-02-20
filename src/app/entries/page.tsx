"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getEntryHistory, getWeeklyEntryTotal } from "@/lib/db";
import { getCountdown, getNextSunday } from "@/lib/utils";
import { ENTRY_REASON_LABELS, type PrizeEntry } from "@/types";
import { cn } from "@/lib/utils";

const WEEKLY_MAX = 32;

const DRAWS = [
  { label: "Weekly Draw",   prize: "$25 Gift Card",      emoji: "🎁", color: "bg-quest-50 border-quest-200",  type: "weekly"   },
  { label: "Monthly Draw",  prize: "Wireless Earbuds",   emoji: "🎧", color: "bg-indigo-50 border-indigo-200", type: "monthly"  },
  { label: "Seasonal Draw", prize: "iPad Mini",           emoji: "📱", color: "bg-amber-50 border-amber-200",  type: "seasonal" },
];

export default function EntriesPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [entries,       setEntries]       = useState<PrizeEntry[]>([]);
  const [weeklyTotal,   setWeeklyTotal]   = useState(0);
  const [countdown,     setCountdown]     = useState({ days: 0, hours: 0, minutes: 0 });
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [hist, weekly] = await Promise.all([
        getEntryHistory(user!.uid, 30),
        getWeeklyEntryTotal(user!.uid),
      ]);
      setEntries(hist);
      setWeeklyTotal(weekly);
      setLoading(false);
    }
    load();
  }, [user]);

  useEffect(() => {
    const update = () => setCountdown(getCountdown(getNextSunday()));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-quest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const weeklyPct = Math.min(100, Math.round((weeklyTotal / WEEKLY_MAX) * 100));

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-black text-quest-800 mb-4">Prize Entries 🎟️</h1>

      {/* Total balance */}
      <div className="card bg-gradient-to-br from-amber-400 to-orange-500 text-white border-0 mb-4 text-center">
        <p className="text-amber-100 text-sm font-medium">Your Entry Balance</p>
        <p className="text-6xl font-black my-2 stat-number">{profile.totalEntries}</p>
        <p className="text-amber-100 text-xs">entries in the prize pool</p>
      </div>

      {/* Weekly progress */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-slate-700 text-sm">This Week&apos;s Entries</p>
          <span className="text-xs font-bold text-quest-600">{weeklyTotal} / {WEEKLY_MAX}</span>
        </div>
        <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-quest-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${weeklyPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">{WEEKLY_MAX - weeklyTotal} more possible this week</p>
      </div>

      {/* Draw countdown */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-slate-700 text-sm">Next Weekly Draw</p>
          <span className="text-xs text-slate-400">Sunday midnight</span>
        </div>
        <p className="font-black text-quest-700 text-xl stat-number">
          {countdown.days}d {countdown.hours}h {countdown.minutes}m
        </p>
      </div>

      {/* Upcoming draws */}
      <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Upcoming Draws</h2>
      <div className="space-y-2 mb-6">
        {DRAWS.map(draw => (
          <div key={draw.type} className={cn("card border", draw.color)}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{draw.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-slate-800 text-sm">{draw.label}</p>
                <p className="text-slate-500 text-xs">{draw.prize}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-quest-700">{profile.currentWeekEntries} entries</p>
                <p className="text-xs text-slate-400">from you</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Entry history */}
      <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Entry History</h2>
      <div className="card divide-y divide-slate-50">
        {entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-3xl mb-2">🎟️</p>
            <p className="text-slate-400 text-sm">No entries yet. Complete a focus session to earn your first!</p>
          </div>
        ) : (
          entries.map(entry => {
            const meta = ENTRY_REASON_LABELS[entry.reason];
            return (
              <div key={entry.id} className="flex items-center gap-3 py-3">
                <span className="text-xl">{meta.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm">{meta.label}</p>
                  <p className="text-slate-400 text-xs">{entry.date}</p>
                </div>
                <span className="entry-ticket flex-shrink-0">+{entry.count} 🎟️</span>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { href: "/dashboard", icon: "🏠", label: "Home",    active: false },
          { href: "/timer",     icon: "⏱️", label: "Focus",   active: false },
          { href: "/quests",    icon: "⚔️", label: "Quests",  active: false },
          { href: "/entries",   icon: "🎟️", label: "Entries", active: true  },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={cn("nav-item", item.active ? "text-quest-600" : "text-slate-400")}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
