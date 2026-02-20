import {
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, orderBy, getDocs, limit,
  serverTimestamp, Timestamp, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ParentProfile, ParentChildLink, InviteCode, ParentBoost, PlanTier } from "@/types/parent";
import type { StudentProfile, FocusSession, PrizeEntry } from "@/types";
import { awardEntries } from "./db";
import { getISOWeek, getToday } from "./utils";

// ─── Parent Profile ───────────────────────────────────────────────────────────

export async function getParentProfile(uid: string): Promise<ParentProfile | null> {
  const snap = await getDoc(doc(db, "parents", uid));
  return snap.exists() ? (snap.data() as ParentProfile) : null;
}

export async function createParentProfile(uid: string, data: Partial<ParentProfile>) {
  await setDoc(doc(db, "parents", uid), {
    uid,
    displayName:            data.displayName ?? "Parent",
    email:                  data.email ?? "",
    plan:                   "explorer" as PlanTier,
    childUids:              [],
    notificationsEnabled:   true,
    weeklyReportEnabled:    true,
    createdAt:              serverTimestamp(),
  });
}

export async function updateParentProfile(uid: string, data: Partial<ParentProfile>) {
  await updateDoc(doc(db, "parents", uid), { ...data });
}

// ─── Child Linking ────────────────────────────────────────────────────────────

export async function getLinkedChildren(parentUid: string): Promise<ParentChildLink[]> {
  const snap = await getDocs(
    query(collection(db, "parentChildLinks"), where("parentUid", "==", parentUid))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ParentChildLink));
}

export async function getChildrenProfiles(childUids: string[]): Promise<StudentProfile[]> {
  if (childUids.length === 0) return [];
  const profiles: StudentProfile[] = [];
  for (const uid of childUids) {
    const snap = await getDoc(doc(db, "students", uid));
    if (snap.exists()) profiles.push(snap.data() as StudentProfile);
  }
  return profiles;
}

// ─── Invite Codes ─────────────────────────────────────────────────────────────

export async function generateInviteCode(parentUid: string): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 48);

  await setDoc(doc(db, "inviteCodes", code), {
    code,
    parentUid,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });
  return code;
}

export async function redeemInviteCode(
  code: string,
  childUid: string,
): Promise<{ success: boolean; error?: string }> {
  const inviteSnap = await getDoc(doc(db, "inviteCodes", code.toUpperCase()));
  if (!inviteSnap.exists()) return { success: false, error: "Code not found. Check for typos." };

  const invite = inviteSnap.data() as InviteCode;
  if (invite.usedBy)                          return { success: false, error: "This code has already been used." };
  if (invite.expiresAt.toDate() < new Date()) return { success: false, error: "This code has expired. Ask your parent for a new one." };

  const childSnap = await getDoc(doc(db, "students", childUid));
  if (!childSnap.exists()) return { success: false, error: "Student profile not found." };
  const childProfile = childSnap.data() as StudentProfile;

  await addDoc(collection(db, "parentChildLinks"), {
    parentUid:         invite.parentUid,
    childUid,
    linkedAt:          serverTimestamp(),
    childDisplayName:  childProfile.displayName,
    childAvatarId:     childProfile.avatarId,
  });

  await updateDoc(doc(db, "parents", invite.parentUid), {
    childUids: arrayUnion(childUid),
  });

  await updateDoc(doc(db, "students", childUid), {
    parentUid: invite.parentUid,
  });

  await updateDoc(doc(db, "inviteCodes", code.toUpperCase()), {
    usedBy: childUid,
    usedAt: serverTimestamp(),
  });

  return { success: true };
}

export async function unlinkChild(parentUid: string, childUid: string) {
  await updateDoc(doc(db, "parents", parentUid), { childUids: arrayRemove(childUid) });
  await updateDoc(doc(db, "students", childUid), { parentUid: null });

  const snap = await getDocs(
    query(
      collection(db, "parentChildLinks"),
      where("parentUid", "==", parentUid),
      where("childUid",  "==", childUid),
    )
  );
  for (const d of snap.docs) await deleteDoc(d.ref);
}

// ─── Child Activity ───────────────────────────────────────────────────────────

export async function getChildSessions(childUid: string, limitCount = 20): Promise<FocusSession[]> {
  const snap = await getDocs(
    query(
      collection(db, "focusSessions"),
      where("studentId", "==", childUid),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FocusSession));
}

export async function getChildSessionsLast7Days(childUid: string): Promise<FocusSession[]> {
  const cutoff = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  })();

  const snap = await getDocs(
    query(
      collection(db, "focusSessions"),
      where("studentId", "==", childUid),
      where("date", ">=", cutoff),
      orderBy("date", "asc"),
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FocusSession));
}

export async function getChildEntries(childUid: string, limitCount = 30): Promise<PrizeEntry[]> {
  const snap = await getDocs(
    query(
      collection(db, "prizeEntries"),
      where("studentId", "==", childUid),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PrizeEntry));
}

// ─── Effort Boosts ────────────────────────────────────────────────────────────

export async function getBoostsThisWeek(parentUid: string, childUid: string): Promise<number> {
  const week = getISOWeek();
  const snap = await getDocs(
    query(
      collection(db, "parentBoosts"),
      where("parentUid", "==", parentUid),
      where("childUid",  "==", childUid),
      where("week",      "==", week),
    )
  );
  return snap.docs.length;
}

export async function giveEffortBoost(
  parentUid: string,
  childUid:  string,
  count:     1 | 2 | 3,
  note?:     string,
): Promise<{ success: boolean; error?: string }> {
  const used = await getBoostsThisWeek(parentUid, childUid);
  if (used >= 2) return { success: false, error: "You've already given 2 boosts this week." };

  await addDoc(collection(db, "parentBoosts"), {
    parentUid,
    childUid,
    count,
    note:      note ?? "",
    date:      getToday(),
    week:      getISOWeek(),
    createdAt: serverTimestamp(),
  });

  await awardEntries(childUid, count, "parent_boost", `boost_${parentUid}_${getToday()}`);
  return { success: true };
}

export async function getBoostHistory(parentUid: string, childUid: string): Promise<ParentBoost[]> {
  const snap = await getDocs(
    query(
      collection(db, "parentBoosts"),
      where("parentUid", "==", parentUid),
      where("childUid",  "==", childUid),
      orderBy("createdAt", "desc"),
      limit(20),
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ParentBoost));
}

// ─── Weekly chart helper ─────────────────────────────────────────────────────

export function buildWeeklyChartData(sessions: FocusSession[]): {
  date: string; label: string; minutes: number; sessions: number;
}[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const label   = d.toLocaleDateString("en-US", { weekday: "short" });
    const daySessions = sessions.filter((s) => s.date === dateStr);
    return {
      date:     dateStr,
      label,
      minutes:  daySessions.reduce((s, sess) => s + sess.durationMinutes, 0),
      sessions: daySessions.length,
    };
  });
}

// ─── Prize Pool (mock — replace with real admin doc in production) ────────────

export async function getPrizePoolHealth() {
  return {
    status:                "green" as const,
    currentBalance:        3240,
    projectedMonthlyDraw:  720,
    coverageRatio:         4.5,
    lastUpdated:           new Date(),
  };
}
