import { create } from "zustand";
import type { User, UserRole } from "@app-types/index";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole;
  sessionToken?: string | null;
  login: (user: User, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  role: "Guest",
  sessionToken: null,
  login: (user: User, token: string | null = null) =>
    set({
      user,
      isAuthenticated: true,
      role: user.role,
      sessionToken: token,
    }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      role: "Guest",
      sessionToken: null,
    }),
}));
