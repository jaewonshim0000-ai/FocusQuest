import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection,
  query, where, orderBy, getDocs, limit,
  serverTimestamp, increment, Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  StudentProfile, FocusSession, PrizeEntry, FocusQuality,
  DailyQuestAssignment, DailyCheckIn, MoodValue, Quest,
} from "@/types";
import { getToday, getISOWeek } from "./utils";

// ─── Student Profile ──────────────────────────────────────────────────────────

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const snap = await getDoc(doc(db, "students", uid));
  return snap.exists() ? (snap.data() as StudentProfile) : null;
}

export async function createStudentProfile(uid: string, data: Partial<StudentProfile>) {
  await setDoc(doc(db, "students", uid), {
    uid,
    displayName:        data.displayName ?? "Student",
    email:              data.email ?? "",
    avatarId:           data.avatarId ?? "owl",
    totalEntries:       0,
    currentWeekEntries: 0,
    currentStreak:      0,
    longestStreak:      0,
    totalFocusMinutes:  0,
    graceUsedThisWeek:  0,
    lastActiveDate:     null,
    createdAt:          serverTimestamp(),
    ...data,
  });
  // Welcome bonus
  await awardEntries(uid, 5, "welcome_bonus", "welcome");
}

export async function updateStudentProfile(uid: string, data: Partial<StudentProfile>) {
  await updateDoc(doc(db, "students", uid), { ...data });
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function updateStreak(uid: string): Promise<void> {
  const profile = await getStudentProfile(uid);
  if (!profile) return;

  const today     = getToday();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })();

  if (profile.lastActiveDate === today) return; // already updated today

  let newStreak = 1;
  if (profile.lastActiveDate === yesterday) {
    newStreak = (profile.currentStreak ?? 0) + 1;
  } else if (profile.lastActiveDate !== null) {
    // Missed a day — check grace
    const grace = profile.graceUsedThisWeek ?? 0;
    if (grace < 2) {
      newStreak = (profile.currentStreak ?? 0) + 1;
      await updateDoc(doc(db, "students", uid), { graceUsedThisWeek: increment(1) });
    } else {
      newStreak = 1;
    }
  }

  const longestStreak = Math.max(newStreak, profile.longestStreak ?? 0);
  await updateDoc(doc(db, "students", uid), {
    currentStreak: newStreak,
    longestStreak,
    lastActiveDate: today,
  });

  // Award streak bonus at multiples of 7
  if (newStreak % 7 === 0) {
    await awardEntries(uid, 3, "streak_bonus", `streak_${newStreak}_${today}`);
  }
}

// ─── Focus Sessions ───────────────────────────────────────────────────────────

const MAX_SESSIONS_PER_DAY = 4;

export async function logFocusSession(
  uid: string,
  durationMinutes: 25 | 50,
  focusQuality: FocusQuality,
  questId?: string,
  questTitle?: string,
): Promise<{ success: boolean; entriesEarned: number; error?: string }> {
  const today = getToday();

  // Enforce daily cap
  const existing = await getDocs(
    query(
      collection(db, "focusSessions"),
      where("studentId", "==", uid),
      where("date", "==", today),
    )
  );
  if (existing.size >= MAX_SESSIONS_PER_DAY) {
    return { success: false, entriesEarned: 0, error: "Daily session limit reached (4 sessions max)." };
  }

  const entriesEarned = durationMinutes === 50 ? 2 : 1;
  const now = Timestamp.now();

  await addDoc(collection(db, "focusSessions"), {
    studentId:       uid,
    questId:         questId ?? null,
    questTitle:      questTitle ?? null,
    durationMinutes,
    focusQuality,
    date:            today,
    startedAt:       new Timestamp(now.seconds - durationMinutes * 60, 0),
    completedAt:     now,
    createdAt:       serverTimestamp(),
    entriesEarned,
  });

  await awardEntries(uid, entriesEarned, "focus_session", `session_${uid}_${Date.now()}`);
  await updateDoc(doc(db, "students", uid), {
    totalFocusMinutes: increment(durationMinutes),
  });
  await updateStreak(uid);

  return { success: true, entriesEarned };
}

export async function getTodaySessions(uid: string): Promise<FocusSession[]> {
  const today = getToday();
  const snap  = await getDocs(
    query(
      collection(db, "focusSessions"),
      where("studentId", "==", uid),
      where("date", "==", today),
      orderBy("createdAt", "desc"),
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FocusSession));
}

// ─── Prize Entries ────────────────────────────────────────────────────────────

export async function awardEntries(
  uid: string,
  count: number,
  reason: PrizeEntry["reason"],
  sourceId: string,
): Promise<void> {
  const today = getToday();
  const week  = getISOWeek();

  await addDoc(collection(db, "prizeEntries"), {
    studentId: uid,
    count,
    reason,
    sourceId,
    date:      today,
    week,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "students", uid), {
    totalEntries:       increment(count),
    currentWeekEntries: increment(count),
  });
}

export async function getEntryHistory(uid: string, limitCount = 20): Promise<PrizeEntry[]> {
  const snap = await getDocs(
    query(
      collection(db, "prizeEntries"),
      where("studentId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PrizeEntry));
}

export async function getWeeklyEntryTotal(uid: string): Promise<number> {
  const week = getISOWeek();
  const snap = await getDocs(
    query(
      collection(db, "prizeEntries"),
      where("studentId", "==", uid),
      where("week", "==", week),
    )
  );
  return snap.docs.reduce((sum, d) => sum + (d.data().count as number), 0);
}

// ─── Mood Check-In ────────────────────────────────────────────────────────────

export async function saveCheckIn(uid: string, mood: MoodValue): Promise<void> {
  const today = getToday();
  await setDoc(doc(db, "checkIns", `${uid}_${today}`), {
    studentId: uid,
    date: today,
    mood,
    createdAt: serverTimestamp(),
  });
}

export async function getTodayCheckIn(uid: string): Promise<DailyCheckIn | null> {
  const today = getToday();
  const snap  = await getDoc(doc(db, "checkIns", `${uid}_${today}`));
  return snap.exists() ? (snap.data() as DailyCheckIn) : null;
}

// ─── Quests ───────────────────────────────────────────────────────────────────

export async function getDefaultQuests(): Promise<Quest[]> {
  const snap = await getDocs(
    query(collection(db, "quests"), where("isDefault", "==", true))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quest));
}

export async function getTodayQuestAssignment(uid: string): Promise<DailyQuestAssignment | null> {
  const today = getToday();
  const snap  = await getDoc(doc(db, "dailyQuests", `${uid}_${today}`));
  return snap.exists() ? (snap.data() as DailyQuestAssignment) : null;
}

export async function saveDailyQuests(uid: string, questIds: string[]): Promise<void> {
  const today = getToday();
  await setDoc(doc(db, "dailyQuests", `${uid}_${today}`), {
    studentId:        uid,
    date:             today,
    questIds,
    completedQuestIds: [],
    createdAt:        serverTimestamp(),
  });
}

export async function completeQuest(uid: string, questId: string): Promise<void> {
  const today  = getToday();
  const docRef = doc(db, "dailyQuests", `${uid}_${today}`);
  const snap   = await getDoc(docRef);
  if (!snap.exists()) return;
  const data = snap.data() as DailyQuestAssignment;
  if (data.completedQuestIds.includes(questId)) return;
  await updateDoc(docRef, {
    completedQuestIds: [...data.completedQuestIds, questId],
  });
}

// ─── Seed default quests (run once from Firebase Console or admin script) ────

export const DEFAULT_QUESTS = [
  { title: "Deep Focus Block",      category: "focus",      durationMinutes: 50, entriesReward: 2, emoji: "🎯", description: "Complete a full 50-min session with zero distractions." },
  { title: "Homework Sprint",       category: "school",     durationMinutes: 25, entriesReward: 1, emoji: "📚", description: "Finish a specific homework assignment in one session." },
  { title: "Reading Quest",         category: "reading",    durationMinutes: 25, entriesReward: 1, emoji: "📖", description: "Read for 25 minutes — any book, any topic." },
  { title: "Screen-Free Morning",   category: "screen_free",durationMinutes: 50, entriesReward: 2, emoji: "🌅", description: "Complete a focus session with all social apps closed." },
  { title: "Practice a Skill",      category: "skill",      durationMinutes: 25, entriesReward: 1, emoji: "🎸", description: "Spend 25 min on a skill: music, art, coding, or sport." },
  { title: "Morning Routine",       category: "routine",    durationMinutes: 25, entriesReward: 1, emoji: "☀️", description: "Complete your morning routine before 9am." },
  { title: "Study Group",           category: "school",     durationMinutes: 50, entriesReward: 2, emoji: "👥", description: "Study with a friend or group for 50 minutes." },
  { title: "Flashcard Blitz",       category: "school",     durationMinutes: 25, entriesReward: 1, emoji: "🃏", description: "Review 25 flashcards in a focused sprint." },
];
