import { create } from 'zustand';
import { UserProfile } from '../types';

interface AuthState {
    user: UserProfile | null;
    isLoading: boolean;
    setUser: (user: UserProfile | null) => void;
    setLoading: (isLoading: boolean) => void;
    updatePreferences: (prefs: Partial<UserProfile['preferences']>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setLoading: (isLoading) => set({ isLoading }),
    updatePreferences: (prefs) => set((state) => {
        if (!state.user) return state;
        return {
            user: {
                ...state.user,
                preferences: {
                    ...state.user.preferences,
                    ...prefs,
                }
            }
        };
    }),
}));
