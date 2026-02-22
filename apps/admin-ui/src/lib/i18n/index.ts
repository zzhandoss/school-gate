import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { enCommon } from "./locales/en";
import { ruCommon } from "./locales/ru";

const resources = {
    en: { common: enCommon },
    ru: { common: ruCommon }
} as const;

if (!i18n.isInitialized) {
    i18n
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            resources,
            supportedLngs: ["en", "ru"],
            fallbackLng: "ru",
            defaultNS: "common",
            ns: ["common"],
            interpolation: {
                escapeValue: false
            },
            detection: {
                order: ["localStorage", "navigator"],
                lookupLocalStorage: "school_gate_admin_locale",
                caches: ["localStorage"]
            }
        });
}

export { i18n };
