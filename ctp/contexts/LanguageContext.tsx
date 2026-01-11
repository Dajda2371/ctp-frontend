import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import i18n from '@/i18n';

const LANGUAGE_KEY = 'user_locale';

interface LanguageContextType {
    locale: string;
    changeLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
    locale: 'en',
    changeLanguage: async () => { },
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [locale, setLocale] = useState(i18n.locale);

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                let savedLocale;
                if (Platform.OS === 'web') {
                    savedLocale = localStorage.getItem(LANGUAGE_KEY);
                } else {
                    savedLocale = await SecureStore.getItemAsync(LANGUAGE_KEY);
                }

                if (savedLocale) {
                    i18n.locale = savedLocale;
                    setLocale(savedLocale);
                }
            } catch (error) {
                console.error('Failed to load language', error);
            }
        };

        loadLanguage();
    }, []);

    const changeLanguage = async (lang: string) => {
        try {
            i18n.locale = lang;
            setLocale(lang);
            if (Platform.OS === 'web') {
                localStorage.setItem(LANGUAGE_KEY, lang);
            } else {
                await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
            }
        } catch (error) {
            console.error('Failed to save language', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ locale, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
