import { useSyncExternalStore } from "react";

import type { SessionState } from "./types";

type Listener = () => void;

let currentSession: SessionState | null = null;
const listeners = new Set<Listener>();

function notify() {
    for (const listener of listeners) {
        listener();
    }
}

export function getSession() {
    return currentSession;
}

export function setSession(session: SessionState) {
    currentSession = session;
    notify();
}

export function clearSession() {
    currentSession = null;
    notify();
}

export function subscribeSession(listener: Listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useSession() {
    return useSyncExternalStore(subscribeSession, getSession, () => null);
}
