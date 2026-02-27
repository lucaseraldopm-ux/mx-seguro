import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { useAuthStore } from '../store/useAuthStore';

// Simple delay to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_USER: UserProfile = {
    id: 'usr-mock-123',
    email: 'teste@mxseguro.com',
    name: 'Usuário Teste',
    plan: 'FREE',
    preferences: {
        alertsEnabled: true,
        alertRadius: 10, // km
        categories: ['Conflito', 'Bloqueio'],
    }
};

const AUTH_STORAGE_KEY = '@MXSeguro:user';

export const AuthService = {
    async initAuth() {
        try {
            const storedUser = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            if (storedUser) {
                useAuthStore.getState().setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.error('Error loading auth state', e);
        } finally {
            useAuthStore.getState().setLoading(false);
        }
    },

    async login(email: string, password: string): Promise<UserProfile> {
        await delay(1000); // simulate network request
        // In mock, any password works for testing
        if (email && password) {
            const user = { ...MOCK_USER, email };
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
            useAuthStore.getState().setUser(user);
            return user;
        }
        throw new Error('Credenciais inválidas');
    },

    async register(email: string, password: string, name: string): Promise<UserProfile> {
        await delay(1000);
        if (email && password && name) {
            const newUser = { ...MOCK_USER, email, name };
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
            useAuthStore.getState().setUser(newUser);
            return newUser;
        }
        throw new Error('Erro ao criar conta');
    },

    async logout() {
        await delay(500);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        useAuthStore.getState().setUser(null);
    },

    async updatePreferences(prefs: Partial<UserProfile['preferences']>) {
        await delay(300);
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                preferences: {
                    ...currentUser.preferences,
                    ...prefs
                }
            };
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
            useAuthStore.getState().updatePreferences(prefs);
        }
    }
};
