import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase, supabaseConfigErrorMessage } from "../lib/supabase";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isRoleLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): AuthUser | null {
  if (!user || !user.email) {
    return null;
  }

  const userName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;

  return {
    id: user.id,
    email: user.email,
    name: userName,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function loadAdminStatus(userId: string | null) {
      if (!userId) {
        setIsAdmin(false);
        setIsRoleLoading(false);
        return;
      }

      setIsRoleLoading(true);
      const { data, error } = await supabase.rpc("is_admin", { check_user_id: userId });
      setIsAdmin(!error && Boolean(data));
      setIsRoleLoading(false);
    }

    if (!isSupabaseConfigured) {
      setUser(null);
      setIsLoading(false);
      setIsAdmin(false);
      setIsRoleLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error) {
        setUser(null);
        setIsLoading(false);
        setIsAdmin(false);
        setIsRoleLoading(false);
        return;
      }

      const mappedUser = mapAuthUser(data.user);
      setUser(mappedUser);
      setIsLoading(false);
      await loadAdminStatus(mappedUser?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const mappedUser = mapAuthUser(session?.user ?? null);
      setUser(mappedUser);
      setIsLoading(false);
      await loadAdminStatus(mappedUser?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isRoleLoading,
      isAuthenticated: Boolean(user),
      isAdmin,
      login: async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
          return { error: supabaseConfigErrorMessage };
        }

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        return { error: error?.message ?? null };
      },
      register: async (name: string, email: string, password: string) => {
        if (!isSupabaseConfigured) {
          return { error: supabaseConfigErrorMessage };
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        return { error: error?.message ?? null };
      },
      logout: async () => {
        if (!isSupabaseConfigured) {
          setIsAdmin(false);
          setIsRoleLoading(false);
          return;
        }

        await supabase.auth.signOut();
      },
    }),
    [isAdmin, isLoading, isRoleLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
