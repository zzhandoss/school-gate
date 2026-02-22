import { i18n } from "./index";

function resolveLocale() {
    return i18n.resolvedLanguage === "ru" ? "ru-RU" : "en-US";
}

export function formatDateTime(value: string | number | Date | null | undefined, fallback = "-") {
    if (!value) {
        return fallback;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }
    return new Intl.DateTimeFormat(resolveLocale(), {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

export function formatDate(value: string | number | Date | null | undefined, fallback = "-") {
    if (!value) {
        return fallback;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }
    return new Intl.DateTimeFormat(resolveLocale(), {
        year: "numeric",
        month: "short",
        day: "2-digit"
    }).format(date);
}

export function formatTime(value: string | number | Date | null | undefined, fallback = "-") {
    if (!value) {
        return fallback;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return fallback;
    }
    return new Intl.DateTimeFormat(resolveLocale(), {
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}
