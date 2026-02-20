import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getISOWeek(date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
  );
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getNextSunday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = 7 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getCountdown(target: Date): { days: number; hours: number; minutes: number } {
  const diff = Math.max(0, target.getTime() - Date.now());
  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}
