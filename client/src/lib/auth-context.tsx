import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "./api";
import type { User } from "./auth.types";
import { applyTheme, getThemeAccountKey, readTheme } from "./theme";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined,
  );

type AuthUserResponse = User & {
  id?: string;
};

function normalizeUser(data: AuthUserResponse): User {
  return {
    ...data,
    _id: data._id ?? data.id ?? "",
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      const nextUser = normalizeUser(response.data.data);
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    applyTheme(readTheme(getThemeAccountKey(user)));
  }, [user]);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const refreshOnFocus = () => { void refreshUser(); };
    const refreshTimer = window.setInterval(() => { void refreshUser(); }, 30_000);
    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [refreshUser]);

  async function login(
    email: string,
    password: string,
  ) {
    const response =
      await api.post("/auth/login", {
        email,
        password,
      });

    const normalizedUser = normalizeUser(response.data.data);
    setUser(normalizedUser);

    return normalizedUser;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Continue with a local logout when the API is temporarily unavailable.
    } finally {
      // A failed network request must not leave the user trapped in a signed-in
      // screen. The server session is already short-lived and can be cleared
      // on the next successful request.
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
