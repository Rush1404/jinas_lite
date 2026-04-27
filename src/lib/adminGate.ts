// ─── Admin Gate ─────────────────────────────────────────────────────────────
// Soft password gate for the admin portal. Stored in sessionStorage so it
// clears when the tab closes. Real security comes from Supabase RLS — even
// past this gate, writes only succeed if the user is in the `admins` table.
// ────────────────────────────────────────────────────────────────────────────

import { config } from "./config";

const KEY = "jinas-lite:admin-unlocked";

export function isAdminUnlocked(): boolean {
  return sessionStorage.getItem(KEY) === "true";
}

export function unlockAdmin(password: string): boolean {
  if (password === config.admin.password) {
    sessionStorage.setItem(KEY, "true");
    return true;
  }
  return false;
}

export function lockAdmin() {
  sessionStorage.removeItem(KEY);
}