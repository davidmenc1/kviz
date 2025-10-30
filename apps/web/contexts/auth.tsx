"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

type AuthContextType = {
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = "admin_session_id";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      setSessionIdState(stored);
      setIsInitialized(true);
    }
  }, []);

  const setSessionId = (newSessionId: string | null) => {
    setSessionIdState(newSessionId);
    if (typeof window !== "undefined") {
      if (newSessionId) {
        localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  };

  // Don't render children until we've checked localStorage
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        sessionId,
        setSessionId,
        isAuthenticated: !!sessionId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
