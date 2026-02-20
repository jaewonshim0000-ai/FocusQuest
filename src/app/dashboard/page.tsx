"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getTodaySessions, getTodayCheckIn, saveCheckIn,
  getWeeklyEntryTotal,
} from "@/lib/db";
import { formatMinutes, getNextSunday, getCountdown } from "@/lib/utils";
import { AVATARS, MOOD_OPTIONS, type FocusSession, type MoodValue } from "@/types";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user, profile, loading, logOut } = useAuth();
  const router = useRouter();

  const [sessions,       setSessions]       = useState<FocusSession[]>([]);
  const [checkInDone,    setCheckInDone]    = useState(false);
  const [weeklyEntries,  setWeeklyEntries]  = useState(0);
  const [countdown,      setCountdown]      = useState({ days: 0, hours: 0, minutes: 0 });
  const [dataLoading,    setDataLoading]    = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [sess, checkIn, entries] = await Promise.all([
      getTodaySessions(user.uid),
      getTodayCheckIn(user.uid),
      getWeeklyEntryTotal(user.uid),
    ]);
    setSessions(sess);
    setCheckInDone(!!checkIn);
    setWeeklyEntries(entries);
    setDataLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const update = () => setCountdown(getCountdown(getNextSunday()));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  async function handleMood(mood: MoodValue) {
    if (!user) return;
    await saveCheckIn(user.uid, mood);
    setCheckInDone(true);
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-quest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avatar       = AVATARS.find(a => a.id === profile.avatarId) ?? AVATARS[0];
  const todayMinutes = sessions.reduce((s, sess) => s + sess.durationMinutes, 0);
  const streakToNext = 7 - ((profile.currentStreak ?? 0) % 7);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-400 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-black text-quest-800">
            Hey, {profile.displayName.split(" ")[0]}! {avatar.emoji}
          </h1>
        </div>
        <button onClick={() => logOut().then(() => router.push("/auth/login"))}
          className="text-slate-400 hover:text-red-400 transition-colors text-xs font-medium p-2">
          ⎋
        </button>
      </div>

      {/* Mood check-in */}
      {!checkInDone && !dataLoading && (
        <div className="card mb-4 animate-slide-up">
          <p className="font-bold text-slate-700 text-sm mb-3">How are you feeling today?</p>
          <div className="flex gap-2">
            {MOOD_OPTIONS.map((m) => (
              <button key={m.value} onClick={() => handleMood(m.value)}
                className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-quest-50 transition-all active:scale-95">
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-slate-500">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard emoji="⏱️" value={formatMinutes(todayMinutes)} label="today" color="bg-blue-50 text-blue-700" />
        <StatCard emoji="🔥" value={`${profile.currentStreak}d`} label="streak" color="bg-orange-50 text-orange-700" />
        <StatCard emoji="🎟️" value={String(weeklyEntries)} label="this week" color="bg-amber-50 text-amber-700" />
      </div>

      {/* Quick start */}
      <div className="card mb-4">
        <p className="font-bold text-slate-700 text-sm mb-3">Start a Focus Session</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/timer?duration=25"
            className="flex flex-col items-center gap-1 bg-quest-50 hover:bg-quest-100 border border-quest-200 rounded-xl p-4 transition-all active:scale-95">
            <span className="text-2xl">⏱️</span>
            <span className="font-black text-quest-700">25 min</span>
            <span className="entry-ticket">+1 🎟️</span>
          </Link>
          <Link href="/timer?duration=50"
            className="flex flex-col items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl p-4 transition-all active:scale-95">
            <span className="text-2xl">🔥</span>
            <span className="font-black text-indigo-700">50 min</span>
            <span className="entry-ticket">+2 🎟️</span>
          </Link>
        </div>
      </div>

      {/* Streak progress */}
      {profile.currentStreak > 0 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-slate-700 text-sm">🔥 Streak Bonus Progress</p>
            <span className="text-xs text-slate-400">{streakToNext} day{streakToNext !== 1 ? "s" : ""} to +3 🎟️</span>
          </div>
          <div className="bg-slate-100 rounded-full h-2">
            <div
              className="bg-orange-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((7 - streakToNext) / 7) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Day {profile.currentStreak} of your current streak</p>
        </div>
      )}

      {/* Weekly draw countdown */}
      <div className="card mb-4 bg-gradient-to-r from-quest-600 to-indigo-600 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-quest-200 text-xs font-medium">Next Weekly Draw</p>
            <p className="font-black text-xl mt-0.5">
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </p>
            <p className="text-quest-200 text-xs mt-0.5">$25 gift card prize</p>
          </div>
          <div className="text-5xl">🎁</div>
        </div>
      </div>

      {/* Today's sessions */}
      {sessions.length > 0 && (
        <div className="card">
          <p className="font-bold text-slate-700 text-sm mb-3">Today&apos;s Sessions</p>
          <div className="space-y-2">
            {sessions.map(sess => (
              <div key={sess.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className="text-xl">{sess.durationMinutes >= 50 ? "🔥" : "⏱️"}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{sess.durationMinutes}-min session</p>
                  <p className="text-xs text-slate-400">
                    {sess.focusQuality === "fully_focused" ? "🔥 Locked In" :
                     sess.focusQuality === "mostly_focused" ? "✅ Pretty Good" : "💪 Tough Session"}
                  </p>
                </div>
                <span className="entry-ticket">+{sess.entriesEarned} 🎟️</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { href: "/dashboard", icon: "🏠", label: "Home" },
          { href: "/timer",     icon: "⏱️", label: "Focus" },
          { href: "/quests",    icon: "⚔️", label: "Quests" },
          { href: "/entries",   icon: "🎟️", label: "Entries" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={cn("nav-item", item.href === "/dashboard" ? "text-quest-600" : "text-slate-400")}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-semibold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function StatCard({ emoji, value, label, color }: {
  emoji: string; value: string; label: string; color: string;
}) {
  return (
    <div className={cn("rounded-2xl p-3 text-center border", color.split(" ").slice(0,2).join(" "),
      color.includes("blue") ? "border-blue-100" : color.includes("orange") ? "border-orange-100" : "border-amber-100")}>
      <div className="text-xl mb-0.5">{emoji}</div>
      <div className={cn("stat-number font-black text-lg", color.split(" ")[1])}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
