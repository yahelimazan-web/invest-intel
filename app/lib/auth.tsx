"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

// =============================================================================
// Types
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// =============================================================================
// Auth Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Auth Provider
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("investintel_current_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to load user:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all users from localStorage
  const getUsers = useCallback((): Record<string, { user: User; password: string }> => {
    try {
      const users = localStorage.getItem("investintel_users");
      return users ? JSON.parse(users) : {};
    } catch {
      return {};
    }
  }, []);

  // Save users to localStorage
  const saveUsers = useCallback((users: Record<string, { user: User; password: string }>) => {
    localStorage.setItem("investintel_users", JSON.stringify(users));
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsers();
    
    const userRecord = users[normalizedEmail];
    
    if (!userRecord) {
      return { success: false, error: "משתמש לא נמצא" };
    }
    
    // Simple password check (in production, use proper hashing)
    if (userRecord.password !== password) {
      return { success: false, error: "סיסמה שגויה" };
    }
    
    // Set user and save to localStorage
    setUser(userRecord.user);
    localStorage.setItem("investintel_current_user", JSON.stringify(userRecord.user));
    
    return { success: true };
  }, [getUsers]);

  // Signup function
  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();
    const users = getUsers();
    
    // Check if user already exists
    if (users[normalizedEmail]) {
      return { success: false, error: "משתמש עם כתובת זו כבר קיים" };
    }
    
    // Validate inputs
    if (!email || !email.includes("@")) {
      return { success: false, error: "כתובת אימייל לא תקינה" };
    }
    
    if (password.length < 6) {
      return { success: false, error: "הסיסמה חייבת להכיל לפחות 6 תווים" };
    }
    
    if (!name.trim()) {
      return { success: false, error: "נא להזין שם" };
    }
    
    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email: normalizedEmail,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };
    
    // Save user
    users[normalizedEmail] = { user: newUser, password };
    saveUsers(users);
    
    // Set as current user
    setUser(newUser);
    localStorage.setItem("investintel_current_user", JSON.stringify(newUser));
    
    // Initialize empty portfolio for new user
    localStorage.setItem(`investintel_folders_${newUser.id}`, JSON.stringify([
      {
        id: "favorites",
        name: "מועדפים",
        color: "pink",
        icon: "heart",
        properties: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: "watching",
        name: "במעקב",
        color: "amber",
        icon: "star",
        properties: [],
        createdAt: new Date().toISOString(),
      },
    ]));
    
    return { success: true };
  }, [getUsers, saveUsers]);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("investintel_current_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// =============================================================================
// User-Specific Storage Utilities
// =============================================================================

export function getUserStorageKey(userId: string | null, baseKey: string): string {
  if (!userId) {
    return baseKey; // Fallback for non-authenticated users
  }
  return `${baseKey}_${userId}`;
}

export function getUserData<T>(userId: string | null, baseKey: string, defaultValue: T): T {
  try {
    const key = getUserStorageKey(userId, baseKey);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setUserData<T>(userId: string | null, baseKey: string, data: T): void {
  try {
    const key = getUserStorageKey(userId, baseKey);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save user data:", e);
  }
}
