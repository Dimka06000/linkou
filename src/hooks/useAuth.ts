import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { isSaasMode } from "./useFeature";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSaasMode() || !supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase) return;
    return supabase.auth.signInWithPassword({ email, password });
  }
  async function signUp(email: string, password: string) {
    if (!supabase) return;
    return supabase.auth.signUp({ email, password });
  }
  async function signOut() {
    if (!supabase) return;
    return supabase.auth.signOut();
  }
  async function signInWithGoogle() {
    if (!supabase) return;
    return supabase.auth.signInWithOAuth({ provider: "google" });
  }

  return { user, loading, signIn, signUp, signOut, signInWithGoogle };
}
