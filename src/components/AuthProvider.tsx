"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: (User & { role?: string }) | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserRole = useCallback(async (userId: string) => {
    console.log(`[AuthProvider] Loading role for user: ${userId}`);
    try {
      const { data, error } = await supabase.rpc("get_user_role");
      if (error) {
        console.error("[AuthProvider] Failed to load user role:", error);
        setRole(null);
      } else {
        console.log(`[AuthProvider] User role loaded: ${data}`);
        setRole(data ?? null);
      }
    } catch (err) {
      console.error("[AuthProvider] Error loading user role:", err);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    console.log("[AuthProvider] Initializing auth state listener...");
    supabase.auth.getUser().then(async ({ data }) => {
      const currentUser = data.user ?? null;
      setUser(currentUser);
      console.log(
        `[AuthProvider] Initial user check: ${currentUser ? currentUser.email : "No user"}`,
      );

      if (currentUser) {
        await loadUserRole(currentUser.id);
      } else {
        setRole(null);
      }

      setLoading(false);
      console.log("[AuthProvider] Initial loading complete.");
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        console.log(
          `[AuthProvider] Auth state changed: Event=${_event}, User=${currentUser ? currentUser.email : "No user"}`,
        );

        if (currentUser) {
          await loadUserRole(currentUser.id);
        } else {
          setRole(null);
        }
      },
    );

    return () => {
      console.log("[AuthProvider] Unsubscribing from auth state changes.");
      sub.subscription.unsubscribe();
    };
  }, [loadUserRole]);

  const signOut = useCallback(async () => {
    console.log("[AuthProvider] Signing out user.");
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  const userWithRole = useMemo(() => {
    return user ? ({ ...user, role } as User & { role?: string }) : null;
  }, [user, role]);

  return (
    <AuthContext.Provider
      value={{ user: userWithRole, role, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
