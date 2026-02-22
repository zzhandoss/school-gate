import { redirect } from "@tanstack/react-router";

import { ensureSession } from "./service";

export async function requireAuth() {
    if (typeof window === "undefined") {
        return;
    }

    const session = await ensureSession();
    if (!session) {
        throw redirect({ to: "/login" });
    }
}

export async function redirectIfAuthed() {
    if (typeof window === "undefined") {
        return;
    }

    const session = await ensureSession();
    if (session) {
        throw redirect({ to: "/dashboard" });
    }
}
