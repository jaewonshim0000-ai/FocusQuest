"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  getDefaultQuests, getTodayQuestAssignment,
  saveDailyQuests, completeQuest,
} from "@/lib/db";
import type { Quest, DailyQuestAssignment, QuestCategory } from "@/types";
import { cn } from "@/lib/utils";

const MAX_DAILY = 3;

const CATEGORY_LABELS: Record<QuestCategory | "all", { label: string; emoji: string }> = {
  all:        { label: "All",         emoji: "✨" },
  focus:      { label: "Focus",       emoji: "🎯" },
  school:     { label: "School",      emoji: "📚" },
  reading:    { label: "Reading",     emoji: "📖" },
  screen_free:{ label: "Screen-Free", emoji: "🌅" },
  skill:      { label: "Skill",       emoji: "🎸" },
  routine:    { label: "Routine",     emoji: "☀️" },
};

export default function QuestsPage() {
  const { user } = useAuth();
  const router   = useRouter();

  const [quests,      setQuests]      = useState<Quest[]>([]);
  const [assignment,  setAssignment]  = useState<DailyQuestAssignment | null>(null);
  const [selected,    setSelected]    = useState<string[]>([]);
  const [filter,      setFilter]      = useState<QuestCategory | "all">("all");
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [q, a] = await Promise.all([getDefaultQuests(), getTodayQuestAssignment(user!.uid)]);
      setQuests(q);
      setAssignment(a);
      if (a) setSelected(a.questIds);
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleLockIn() {
    if (!user || selected.length === 0) return;
    setSaving(true);
    await saveDailyQuests(user.uid, selected);
    const a = await getTodayQuestAssignment(user.uid);
    setAssignment(a);
    setSaving(false);
  }

  async function handleComplete(questId: string) {
    if (!user || !assignment) return;
    await completeQuest(user.uid, questId);
    setAssignment(prev => prev ? {
      ...prev,
      completedQuestIds: [...prev.completedQuestIds, questId],
    } : prev);
  }

  function toggleSelect(id: string) {
    if (assignment) return; // locked in
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_DAILY ? [...prev, id] : prev
    );
  }

  const filtered = filter === "all" ? quests : quests.filter(q => q.category === filter);
  const locked   = !!assignment;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-quest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-black text-quest-800 mb-1">Daily Quests ⚔️</h1>
      <p className="text-slate-500 text-sm mb-4">
        {locked
          ? `${assignment!.questIds.length} quest${assignment!.questIds.length !== 1 ? "s" : ""} locked in for today`
          : `Choose up to ${MAX_DAILY} quests for today`}
      </p>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {(Object.keys(CATEGORY_LABELS) as (QuestCategory | "all")[]).map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
              filter === cat
                ? "bg-quest-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-quest-300"
            )}>
            {CATEGORY_LABELS[cat].emoji} {CATEGORY_LABELS[cat].label}
          </button>
        ))}
      </div>

      {/* Quest list */}
      <div className="space-y-2 mb-6">
        {filtered.length === 0 && (
          <div className="card text-center py-8 text-slate-400">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm">No quests found in this category.</p>
          </div>
        )}

        {filtered.map(quest => {
          const isSelected  = selected.includes(quest.id);
          const isCompleted = assignment?.completedQuestIds.includes(quest.id) ?? false;
          const showInLocked = !locked || assignment?.questIds.includes(quest.id);
          if (!showInLocked) return null;

          return (
            <div key={quest.id}
              onClick={() => !locked && !isCompleted && toggleSelect(quest.id)}
              className={cn(
                "card transition-all",
                !locked && !isCompleted && "cursor-pointer hover:border-quest-300",
                isSelected  && !locked  && "border-quest-400 bg-quest-50",
                isCompleted             && "opacity-60",
              )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                  isCompleted ? "bg-emerald-100" : "bg-slate-50"
                )}>
                  {isCompleted ? "✅" : quest.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-bold text-sm",
                    isCompleted ? "text-slate-400 line-through" : "text-slate-800"
                  )}>
                    {quest.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{quest.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{quest.durationMinutes} min</span>
                    <span className="entry-ticket">+{quest.entriesReward} 🎟️</span>
                  </div>
                </div>
                {locked && assignment?.questIds.includes(quest.id) && !isCompleted && (
                  <button onClick={e => { e.stopPropagation(); handleComplete(quest.id); }}
                    className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95">
                    Done ✓
                  </button>
                )}
                {!locked && isSelected && (
                  <div className="w-6 h-6 rounded-full bg-quest-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lock in button */}
      {!locked && selected.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto">
          <button onClick={handleLockIn} disabled={saving}
            className="btn-primary w-full text-base shadow-lg">
            {saving ? "Locking in…" : `Lock In ${selected.length} Quest${selected.length !== 1 ? "s" : ""} ⚔️`}
          </button>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { href: "/dashboard", icon: "🏠", label: "Home",    active: false },
          { href: "/timer",     icon: "⏱️", label: "Focus",   active: false },
          { href: "/quests",    icon: "⚔️", label: "Quests",  active: true  },
          { href: "/entries",   icon: "🎟️", label: "Entries", active: false },
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
