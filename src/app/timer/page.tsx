"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { logFocusSession } from "@/lib/db";
import { formatTime, cn } from "@/lib/utils";
import { FOCUS_QUALITY_OPTIONS, type FocusQuality, type TimerStatus, type TimerMode } from "@/types";

const BREAK_SECONDS = 5 * 60;

// ── Suspense wrapper required by Next.js 15 for useSearchParams ──────────────
export default function TimerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-quest-50 to-indigo-50">
        <div className="w-10 h-10 border-2 border-quest-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TimerPageInner />
    </Suspense>
  );
}

function TimerPageInner() {
  const { user, refreshProfile } = useAuth();
  const router  = useRouter();
  const params  = useSearchParams();
  const durationParam = parseInt(params.get("duration") ?? "25", 10);

  const [durationMinutes] = useState<25 | 50>(durationParam === 50 ? 50 : 25);
  const [totalSeconds]    = useState(durationParam === 50 ? 3000 : 1500);
  const [secondsLeft,  setSecondsLeft]  = useState(durationParam === 50 ? 3000 : 1500);
  const [status,       setStatus]       = useState<TimerStatus>("idle");
  const [mode,         setMode]         = useState<TimerMode>("focus");
  const [startedAt,    setStartedAt]    = useState<Date | null>(null);
  const [showQuality,  setShowQuality]  = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [quality,      setQuality]      = useState<FocusQuality | null>(null);
  const [entriesEarned,setEntriesEarned]= useState(0);
  const [saving,       setSaving]       = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current!);
        setStatus("completed");
        if (mode === "focus") setShowQuality(true);
        else setMode("focus"); // break done
        return 0;
      }
      return prev - 1;
    });
  }, [mode]);

  useEffect(() => {
    if (status === "running") {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [status, tick]);

  function startTimer() {
    setStartedAt(new Date());
    setStatus("running");
  }
  function pauseTimer()  { setStatus("paused"); }
  function resumeTimer() { setStatus("running"); }

  function resetTimer() {
    clearInterval(intervalRef.current!);
    setSecondsLeft(totalSeconds);
    setStatus("idle");
    setMode("focus");
    setShowQuality(false);
    setShowComplete(false);
    setQuality(null);
  }

  async function handleQualitySubmit() {
    if (!quality || !user) return;
    setSaving(true);
    const result = await logFocusSession(user.uid, durationMinutes, quality);
    setSaving(false);
    if (result.success) {
      setEntriesEarned(result.entriesEarned);
      setShowQuality(false);
      setShowComplete(true);
      await refreshProfile();
    }
  }

  function startBreak() {
    setShowComplete(false);
    setMode("break");
    setSecondsLeft(BREAK_SECONDS);
    setStatus("running");
  }

  const progress = mode === "focus"
    ? ((totalSeconds - secondsLeft) / totalSeconds) * 100
    : ((BREAK_SECONDS - secondsLeft) / BREAK_SECONDS) * 100;

  const isBreak = mode === "break";

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="btn-ghost p-2">←</Link>
        <h1 className="font-black text-xl text-quest-800">
          {isBreak ? "Break Time 🧘" : `${durationMinutes}-Minute Focus`}
        </h1>
        <div className="ml-auto entry-ticket">+{durationMinutes === 50 ? 2 : 1} 🎟️</div>
      </div>

      {/* Timer circle */}
      {!showQuality && !showComplete && (
        <div className="flex flex-col items-center">
          <div className="w-64 h-64 mb-8">
            <CircularProgressbar
              value={progress}
              text={formatTime(secondsLeft)}
              styles={buildStyles({
                pathColor:        isBreak ? "#10b981" : "#4f46e5",
                trailColor:       "#e0e7ff",
                textColor:        "#1e1b4b",
                textSize:         "18px",
                pathTransitionDuration: 0.5,
              })}
            />
          </div>

          <div className="flex gap-3">
            {status === "idle" && (
              <button onClick={startTimer} className="btn-primary px-10 text-base">
                Start Focus 🎯
              </button>
            )}
            {status === "running" && (
              <button onClick={pauseTimer} className="btn-ghost border border-quest-200 px-8">
                ⏸ Pause
              </button>
            )}
            {status === "paused" && (
              <>
                <button onClick={resumeTimer} className="btn-primary px-8">▶ Resume</button>
                <button onClick={resetTimer}  className="btn-ghost border border-slate-200 px-6">Reset</button>
              </>
            )}
          </div>

          {status !== "idle" && (
            <button onClick={resetTimer} className="text-slate-400 text-xs mt-4 hover:text-slate-600 transition-colors">
              Cancel session
            </button>
          )}
        </div>
      )}

      {/* Quality check */}
      {showQuality && (
        <div className="card animate-slide-up space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">⏱️</div>
            <h2 className="font-black text-xl text-quest-800">Session complete!</h2>
            <p className="text-slate-500 text-sm mt-1">How was your focus?</p>
          </div>

          <div className="space-y-2">
            {FOCUS_QUALITY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setQuality(opt.value)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                  quality === opt.value
                    ? "border-quest-500 bg-quest-50"
                    : "border-slate-100 hover:border-slate-300"
                )}>
                <span className="text-2xl">{opt.emoji}</span>
                <div>
                  <p className="font-bold text-slate-800">{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>

          <button onClick={handleQualitySubmit} disabled={!quality || saving} className="btn-primary w-full">
            {saving ? "Saving…" : "Claim entries 🎟️"}
          </button>
        </div>
      )}

      {/* Completion */}
      {showComplete && (
        <div className="card text-center animate-slide-up">
          <div className="text-6xl mb-4 animate-bounce-slow">🎉</div>
          <h2 className="font-black text-2xl text-quest-800">You earned</h2>
          <div className="text-5xl font-black text-amber-500 my-3 animate-entry-pop">
            +{entriesEarned} 🎟️
          </div>
          <p className="text-slate-500 text-sm mb-6">
            {entriesEarned === 2 ? "50-minute deep focus — max reward!" : "Keep building that streak!"}
          </p>
          <div className="space-y-2">
            <button onClick={startBreak} className="btn-ghost w-full border border-emerald-200 text-emerald-700">
              Take a 5-min break 🧘
            </button>
            <Link href="/dashboard" className="btn-primary w-full block">
              🏠 Back to Dashboard
            </Link>
            <button onClick={resetTimer} className="btn-ghost w-full text-sm">
              🔄 Start another session
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {[
          { href: "/dashboard", icon: "🏠", label: "Home",    active: false },
          { href: "/timer",     icon: "⏱️", label: "Focus",   active: true  },
          { href: "/quests",    icon: "⚔️", label: "Quests",  active: false },
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
