"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getStudentProfile, createStudentProfile } from "@/lib/db";
import type { StudentProfile, AvatarId } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: StudentProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, avatarId: AvatarId) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(u: User) {
    let p = await getStudentProfile(u.uid);
    if (!p) {
      await createStudentProfile(u.uid, {
        displayName: u.displayName ?? "Student",
        email:       u.email ?? "",
        avatarId:    "owl",
      });
      p = await getStudentProfile(u.uid);
    }
    setProfile(p);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadProfile(u);
      else setProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string, displayName: string, avatarId: AvatarId) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await createStudentProfile(cred.user.uid, { displayName, email, avatarId });
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logOut() {
    await signOut(auth);
  }

  async function refreshProfile() {
    if (user) {
      const p = await getStudentProfile(user.uid);
      setProfile(p);
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signInWithGoogle, logOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
