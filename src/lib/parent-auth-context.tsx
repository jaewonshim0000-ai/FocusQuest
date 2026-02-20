"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getParentProfile, createParentProfile } from "@/lib/parent-db";
import type { ParentProfile } from "@/types/parent";

interface ParentAuthContextType {
  user: User | null;
  parentProfile: ParentProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ParentAuthContext = createContext<ParentAuthContextType | null>(null);

export function ParentAuthProvider({ children }: { children: React.ReactNode }) {
  const [user,          setUser]          = useState<User | null>(null);
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [loading,       setLoading]       = useState(true);

  async function loadProfile(u: User) {
    let p = await getParentProfile(u.uid);
    if (!p) {
      await createParentProfile(u.uid, {
        displayName: u.displayName ?? "Parent",
        email:       u.email ?? "",
      });
      p = await getParentProfile(u.uid);
    }
    setParentProfile(p);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await loadProfile(u);
      else setParentProfile(null);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await createParentProfile(cred.user.uid, { displayName, email });
  }

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logOut() {
    await signOut(auth);
  }

  async function refreshProfile() {
    if (user) {
      const p = await getParentProfile(user.uid);
      setParentProfile(p);
    }
  }

  return (
    <ParentAuthContext.Provider
      value={{ user, parentProfile, loading, signIn, signUp, signInWithGoogle, logOut, refreshProfile }}
    >
      {children}
    </ParentAuthContext.Provider>
  );
}

export function useParentAuth() {
  const ctx = useContext(ParentAuthContext);
  if (!ctx) throw new Error("useParentAuth must be used inside ParentAuthProvider");
  return ctx;
}
