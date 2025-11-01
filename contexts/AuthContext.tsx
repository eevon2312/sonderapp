import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password_DO_NOT_USE_IN_PROD: string) => Promise<void>;
  signup: (name: string, email: string, password_DO_NOT_USE_IN_PROD: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => Promise<void>;
  loginAsGuest: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'sonder_users';
const CURRENT_USER_STORAGE_KEY = 'sonder_current_user_email';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const currentUserEmail = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (currentUserEmail) {
        const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
        const loggedInUser = users.find(u => u.email === currentUserEmail);
        if (loggedInUser) {
          setUser(loggedInUser);
        }
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
    }
  }, []);

  const login = useCallback(async (email: string, password_DO_NOT_USE_IN_PROD: string): Promise<void> => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const foundUser = users.find(u => u.email === email && u.password_DO_NOT_USE_IN_PROD === password_DO_NOT_USE_IN_PROD);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, foundUser.email);
    } else {
      throw new Error("Invalid email or password");
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password_DO_NOT_USE_IN_PROD: string): Promise<void> => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    if (users.some(u => u.email === email)) {
      throw new Error("An account with this email already exists");
    }

    const newUser: User = {
      name,
      email,
      password_DO_NOT_USE_IN_PROD,
      onboardingComplete: false,
    };

    users.push(newUser);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    await login(email, password_DO_NOT_USE_IN_PROD);
  }, [login]);
  
  const completeOnboarding = useCallback(async (): Promise<void> => {
    if (!user) return;

    const updatedUser = { ...user, onboardingComplete: true };
    const users: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const userIndex = users.findIndex(u => u.email === user.email);

    if (userIndex > -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        setUser(updatedUser);
    }
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  }, []);
  
  const loginAsGuest = useCallback(() => {
    const guestUser: User = {
      name: 'Guest',
      email: 'guest@demo.sonder',
      password_DO_NOT_USE_IN_PROD: '',
      onboardingComplete: true, // Bypass onboarding for the demo
    };
    setUser(guestUser);
    // Note: We don't set localStorage for the current user to make it a session-only login.
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, completeOnboarding, loginAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};