import { ApiError } from "@/lib/api/types";

export function getPersonsImportErrorMessage(value: unknown, fallback: string) {
    if (value instanceof ApiError) {
        return value.message || fallback;
    }
    if (value instanceof Error) {
        return value.message || fallback;
    }
    return fallback;
}

export function logPersonsImportError(scope: string, value: unknown, details?: Record<string, unknown>) {
    console.error(`[persons/import] ${scope}`, {
        error: value,
        ...details
    });
}
