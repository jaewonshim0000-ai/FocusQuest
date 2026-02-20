"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useParentAuth } from "@/lib/parent-auth-context";
import { PLAN_DETAILS } from "@/types/parent";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/parent/dashboard", icon: "⊡", label: "Overview"  },
  { href: "/parent/add-child", icon: "＋", label: "Add Child" },
  { href: "/parent/settings",  icon: "⚙", label: "Settings"  },
];

// Auth pages that should render without the shell chrome
const AUTH_PATHS = ["/parent/login", "/parent/signup"];

export default function ParentShell({ children }: { children: React.ReactNode }) {
  const { user, parentProfile, loading, logOut } = useParentAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = AUTH_PATHS.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push("/parent/login");
    }
  }, [user, loading, router, isAuthPage]);

  // Render auth pages bare — no sidebar chrome
  if (isAuthPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen parent-bg flex items-center justify-center"
        style={{ fontFamily: "DM Sans, sans-serif" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const plan     = parentProfile?.plan ?? "explorer";
  const planInfo = PLAN_DETAILS[plan];

  function isActive(href: string) {
    return pathname === href ||
      pathname.startsWith(href + "/") ||
      (href === "/parent/dashboard" && pathname.startsWith("/parent/child"));
  }

  return (
    <div className="min-h-screen parent-bg flex" style={{ fontFamily: "DM Sans, sans-serif" }}>
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-100 shadow-sm z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm tracking-tight">FocusQuest</p>
              <p className="text-slate-400 text-xs font-medium">Parent Portal</p>
            </div>
          </div>
        </div>

        {/* Plan badge */}
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
          <span className="text-base">{planInfo.badge}</span>
          <div>
            <p className="text-xs font-bold text-slate-700">{planInfo.label} Plan</p>
            <p className="text-xs text-slate-400">{planInfo.price}</p>
          </div>
          <Link href="/parent/settings" className="ml-auto text-emerald-600 text-xs font-semibold hover:underline">
            Upgrade
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                isActive(item.href)
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {(parentProfile?.displayName ?? "P")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{parentProfile?.displayName}</p>
              <p className="text-xs text-slate-400 truncate">{parentProfile?.email}</p>
            </div>
            <button onClick={() => logOut().then(() => router.push("/parent/login"))}
              className="text-slate-400 hover:text-red-500 transition-colors text-xs" title="Sign out">
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-sm">🎯</span>
          </div>
          <span className="font-black text-slate-800 text-sm">FocusQuest Parent</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-600">☰</button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 pt-16 space-y-1">
              {NAV.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"
                  )}>
                  <span>{item.icon}</span>{item.label}
                </Link>
              ))}
              <button onClick={() => logOut().then(() => router.push("/parent/login"))}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50">
                <span>⎋</span> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
