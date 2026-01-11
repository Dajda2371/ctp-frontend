import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import en from './translations/en';
import cs from './translations/cs';

const i18n = new I18n({
    en,
    cs,
});

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

const locales = getLocales();
if (locales && locales.length > 0) {
    i18n.locale = locales[0].languageCode ?? 'en';
} else {
    i18n.locale = 'en';
}

export default i18n;
