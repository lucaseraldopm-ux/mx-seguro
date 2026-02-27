import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';

const LANGUAGE_KEY = '@MXSeguro:language';

const languageDetector = {
    type: 'languageDetector' as const,
    async: true,
    detect: async (callback: (lng: string) => void) => {
        try {
            const savedDataJSON = await AsyncStorage.getItem(LANGUAGE_KEY);
            const lng = savedDataJSON ? savedDataJSON : 'es';
            callback(lng);
        } catch (e) {
            callback('es');
        }
    },
    init: () => { },
    cacheUserLanguage: async (lng: string) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, lng);
        } catch (e) {
            console.error('Error saving language', e);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'es',
        resources: {
            es: { translation: es },
            en: { translation: en },
            pt: { translation: pt },
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
