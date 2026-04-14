import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setUser(mapAuthUser(data.user));
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapAuthUser(session?.user ?? null));
      setIsLoading(false);
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
      isAuthenticated: Boolean(user),
      login: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        return { error: error?.message ?? null };
      },
      register: async (name: string, email: string, password: string) => {
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
        await supabase.auth.signOut();
      },
    }),
    [isLoading, user],
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
