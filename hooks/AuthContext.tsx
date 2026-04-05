"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ADMIN_PASSWORD = "12345";
const AUTH_KEY = "checklist_admin_auth";

interface AuthContextType {
  isLoggedIn: boolean;
  isInitialized: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem(AUTH_KEY);
    if (auth === "true") {
      setIsLoggedIn(true);
    }
    setIsInitialized(true);
  }, []);

  const login = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "true");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
