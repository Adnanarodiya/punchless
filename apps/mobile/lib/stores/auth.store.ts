import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { getSessionUserProfile, signInWithEmail, signOutUser, type MobileUser } from "@/lib/services/auth.service";

type AuthState = {
  user: MobileUser | null;
  initialized: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  loading: false,

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true });

    const profile = await getSessionUserProfile();
    set({ user: profile, initialized: true, loading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        set({ user: null });
        return;
      }
      const fresh = await getSessionUserProfile();
      set({ user: fresh });
    });
  },

  refreshUser: async () => {
    const profile = await getSessionUserProfile();
    set({ user: profile });
  },

  login: async (email, password) => {
    set({ loading: true });
    const { error } = await signInWithEmail(email, password);
    if (error) {
      set({ loading: false });
      return { success: false, error: error.message };
    }

    const profile = await getSessionUserProfile();
    set({ user: profile, loading: false });
    return { success: true };
  },

  logout: async () => {
    set({ loading: true });
    await signOutUser();
    set({ user: null, loading: false });
  },
}));
