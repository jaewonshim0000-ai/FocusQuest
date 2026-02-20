import { Timestamp } from "firebase/firestore";

export type PlanTier = "explorer" | "adventurer" | "champion";

export interface ParentProfile {
  uid: string;
  displayName: string;
  email: string;
  plan: PlanTier;
  childUids: string[];
  notificationsEnabled: boolean;
  weeklyReportEnabled: boolean;
  createdAt: Timestamp;
}

export const PLAN_DETAILS: Record<PlanTier, {
  label: string; price: string; maxChildren: number; color: string; badge: string;
}> = {
  explorer:   { label: "Explorer",   price: "Free",      maxChildren: 1, color: "bg-slate-100 text-slate-600",    badge: "🗺️" },
  adventurer: { label: "Adventurer", price: "$8.99/mo",  maxChildren: 2, color: "bg-emerald-100 text-emerald-700", badge: "⚔️" },
  champion:   { label: "Champion",   price: "$14.99/mo", maxChildren: 4, color: "bg-amber-100 text-amber-700",    badge: "🏆" },
};

export interface ParentChildLink {
  id: string;
  parentUid: string;
  childUid: string;
  linkedAt: Timestamp;
  childDisplayName: string;
  childAvatarId: string;
}

export interface InviteCode {
  code: string;
  parentUid: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  usedBy?: string;
  usedAt?: Timestamp;
}

export interface ParentBoost {
  id: string;
  parentUid: string;
  childUid: string;
  count: number;
  note?: string;
  date: string;
  week: string;
  createdAt: Timestamp;
}

export type PoolHealthStatus = "green" | "yellow" | "red";

export interface PrizePoolHealth {
  status: PoolHealthStatus;
  currentBalance: number;
  projectedMonthlyDraw: number;
  coverageRatio: number;
  lastUpdated: Date;
}

export const POOL_HEALTH_LABELS: Record<PoolHealthStatus, {
  label: string; description: string; color: string; bg: string;
}> = {
  green:  { label: "Healthy", description: "Prize pool fully funded for 90+ days",     color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  yellow: { label: "Watch",   description: "Prize pool covering next 30–89 days",       color: "text-amber-700",   bg: "bg-amber-50 border-amber-200"   },
  red:    { label: "Low",     description: "Prize pool may impact upcoming draws",      color: "text-red-700",     bg: "bg-red-50 border-red-200"       },
};
