import { create } from "zustand";
import type { User, UserRole } from "@app-types/index";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  role: "Guest",
  login: (user: User) =>
    set({
      user,
      isAuthenticated: true,
      role: user.role,
    }),
  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      role: "Guest",
    }),
}));
