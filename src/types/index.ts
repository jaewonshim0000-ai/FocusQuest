import { Timestamp } from "firebase/firestore";

// ─── Student ──────────────────────────────────────────────────────────────────

export interface StudentProfile {
  uid: string;
  displayName: string;
  email?: string;
  avatarId: AvatarId;
  totalEntries: number;
  currentWeekEntries: number;
  currentStreak: number;
  longestStreak: number;
  totalFocusMinutes: number;
  graceUsedThisWeek: number;
  lastActiveDate: string | null; // "YYYY-MM-DD"
  parentUid?: string;
  createdAt: Timestamp;
}

export type AvatarId = "owl" | "fox" | "dragon" | "cat" | "robot" | "astronaut";

export interface Avatar {
  id: AvatarId;
  emoji: string;
  name: string;
  color: string;
}

export const AVATARS: Avatar[] = [
  { id: "owl",       emoji: "🦉", name: "Wise Owl",    color: "#6366f1" },
  { id: "fox",       emoji: "🦊", name: "Swift Fox",   color: "#f59e0b" },
  { id: "dragon",    emoji: "🐉", name: "Focus Dragon",color: "#ef4444" },
  { id: "cat",       emoji: "🐱", name: "Cool Cat",    color: "#8b5cf6" },
  { id: "robot",     emoji: "🤖", name: "Logic Bot",   color: "#06b6d4" },
  { id: "astronaut", emoji: "👨‍🚀", name: "Space Hero",  color: "#10b981" },
];

// ─── Quests ───────────────────────────────────────────────────────────────────

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  durationMinutes: number;
  entriesReward: number;
  isDefault: boolean;
  emoji: string;
  studentId?: string;
  createdAt: Timestamp;
}

export type QuestCategory =
  | "focus" | "school" | "reading" | "screen_free" | "skill" | "routine";

export interface DailyQuestAssignment {
  studentId: string;
  date: string;
  questIds: string[];
  completedQuestIds: string[];
  createdAt: Timestamp;
}

// ─── Focus Sessions ───────────────────────────────────────────────────────────

export interface FocusSession {
  id: string;
  studentId: string;
  questId?: string;
  questTitle?: string;
  durationMinutes: number;
  focusQuality: FocusQuality;
  date: string;
  startedAt: Timestamp;
  completedAt: Timestamp;
  createdAt: Timestamp;
  entriesEarned: number;
}

export type FocusQuality = "fully_focused" | "mostly_focused" | "struggled";

export const FOCUS_QUALITY_OPTIONS: {
  value: FocusQuality;
  label: string;
  emoji: string;
  description: string;
}[] = [
  { value: "fully_focused",   label: "Locked In",    emoji: "🔥", description: "Barely noticed time passing" },
  { value: "mostly_focused",  label: "Pretty Good",  emoji: "✅", description: "A few distractions, but mostly focused" },
  { value: "struggled",       label: "Tough Session",emoji: "💪", description: "Hard today, but I showed up" },
];

// ─── Prize Entries ────────────────────────────────────────────────────────────

export interface PrizeEntry {
  id: string;
  studentId: string;
  count: number;
  reason: EntryReason;
  sourceId: string;
  date: string;
  week: string;
  createdAt: Timestamp;
}

export type EntryReason =
  | "focus_session" | "streak_bonus" | "monthly_streak" | "parent_boost" | "welcome_bonus";

export const ENTRY_REASON_LABELS: Record<EntryReason, { label: string; emoji: string }> = {
  focus_session:  { label: "Focus Session",       emoji: "⏱️" },
  streak_bonus:   { label: "7-Day Streak Bonus",  emoji: "🔥" },
  monthly_streak: { label: "Monthly Streak!",     emoji: "🏆" },
  parent_boost:   { label: "Parent Boost",        emoji: "⭐" },
  welcome_bonus:  { label: "Welcome Bonus",       emoji: "🎉" },
};

// ─── Mood Check-In ────────────────────────────────────────────────────────────

export interface DailyCheckIn {
  studentId: string;
  date: string;
  mood: MoodValue;
  createdAt: Timestamp;
}

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export const MOOD_OPTIONS: { value: MoodValue; emoji: string; label: string; message: string }[] = [
  { value: 1, emoji: "😔", label: "Rough",  message: "That's okay. Showing up counts." },
  { value: 2, emoji: "😕", label: "Meh",    message: "Some days are like this. You've got this." },
  { value: 3, emoji: "😐", label: "Okay",   message: "Steady is good. Let's make it count." },
  { value: 4, emoji: "🙂", label: "Good",   message: "Nice! Good energy today." },
  { value: 5, emoji: "😄", label: "Great",  message: "Amazing! Let's have a great session." },
];

// ─── Timer ────────────────────────────────────────────────────────────────────

export type TimerMode   = "focus" | "break";
export type TimerStatus = "idle" | "running" | "paused" | "completed";

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  secondsRemaining: number;
  totalSeconds: number;
  sessionCount: number;
  questId?: string;
  questTitle?: string;
  startedAt?: Date;
}

// ─── Draw Events ──────────────────────────────────────────────────────────────

export interface DrawEvent {
  id: string;
  type: "weekly" | "monthly" | "seasonal";
  scheduledAt: Timestamp;
  status: "upcoming" | "completed";
  prizeTitle: string;
  prizeEmoji: string;
  prizeDescription: string;
  winnerCount: number;
  totalEntryPool?: number;
}
