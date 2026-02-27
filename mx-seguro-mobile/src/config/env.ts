// Configuração Global de Ambiente e Defaults
// Fallback para IP Local ou localhost (quando emulado)
const DEFAULT_API_URL = 'http://10.0.0.101:3000/api';

export const ENV = {
    // O Expo processa variáveis iniciadas em EXPO_PUBLIC_ no momento do build
    API_URL: process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL,
};
