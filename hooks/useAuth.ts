"use client";

import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "12345";
const AUTH_KEY = "checklist_admin_auth";

export function useAuth() {
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

  return { isLoggedIn, isInitialized, login, logout };
}
