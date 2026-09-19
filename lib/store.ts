import { create } from "zustand";

interface User {
  id: string;
  email: string;
  phone: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface AuthStore {
  user:      User | null;
  isLoading: boolean;
  setUser:   (user: User | null) => void;
  setLoading:(loading: boolean) => void;
  logout:    () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user:      null,
  isLoading: true,
  setUser:   (user) => set({ user }),
  setLoading:(isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null });
  },
}));