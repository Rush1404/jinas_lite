// ─── Auth Store ─────────────────────────────────────────────────────────────
// Wrapper around Supabase auth with a pub/sub interface for the rest of the
// app (header, account page, admin gate) to react to sign-in / sign-out.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

type Listener = (state: AuthState) => void;

class AuthStore {
  private state: AuthState = { user: null, isAdmin: false, loading: true };
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  /** Call once on app boot. Hydrates session and starts listening for changes. */
  async init() {
    if (this.initialized) return;
    this.initialized = true;

    const { data } = await supabase.auth.getSession();
    await this.setUser(data.session?.user ?? null);

    supabase.auth.onAuthStateChange(async (_event, session) => {
      await this.setUser(session?.user ?? null);
    });
  }

  private async setUser(user: User | null) {
    let isAdmin = false;
    if (user) {
      // Look up admin status. RLS lets a user see their own row in admins.
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows; anything else, just treat as not admin.
        console.warn("admin lookup failed:", error.message);
      }
      isAdmin = !!data;
    }
    this.state = { user, isAdmin, loading: false };
    this.notify();
  }

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  // ── Auth actions ────────────────────────────────────────────────────────

  async signUp(email: string, password: string) {
    return await supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    await supabase.auth.signOut();
  }
}

export const authStore = new AuthStore();