import type { SessionState } from "./types";

const SESSION_KEY = "school_gate_admin_session";

function isBrowser() {
    return typeof window !== "undefined";
}

export function readStoredSession() {
    if (!isBrowser()) {
        return null;
    }

    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as SessionState;
    } catch {
        window.localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export function writeStoredSession(session: SessionState) {
    if (!isBrowser()) {
        return;
    }
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
    if (!isBrowser()) {
        return;
    }
    window.localStorage.removeItem(SESSION_KEY);
}
