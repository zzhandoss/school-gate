import { createHash } from "node:crypto";
import type { PersonImportCandidateStatusDto } from "@school-gate/contracts";
import { HttpError } from "../../../delivery/http/errors/httpError.js";

function normalizeImportIin(value: string | null | undefined) {
    if (!value) {
        return null;
    }

    const digits = value.replace(/\D/g, "");
    return /^\d{12}$/.test(digits) ? digits : null;
}

function parseImportSettings(settingsJson: string | null | undefined): Record<string, unknown> | null {
    if (!settingsJson) {
        return null;
    }

    try {
        const parsed = JSON.parse(settingsJson);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }

        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

function getImportIinSourceMapping(settingsJson: string | null | undefined): { source: string | null; fieldName: string } | null {
    const settings = parseImportSettings(settingsJson);
    if (!settings) {
        return null;
    }

    const mappings = settings.identityQueryMappings;
    if (!mappings || typeof mappings !== "object" || Array.isArray(mappings)) {
        return null;
    }

    const iinMapping = (mappings as Record<string, unknown>)["iin"];
    if (!iinMapping || typeof iinMapping !== "object" || Array.isArray(iinMapping)) {
        return null;
    }

    const paramsTemplate = (iinMapping as Record<string, unknown>)["paramsTemplate"];
    if (!paramsTemplate || typeof paramsTemplate !== "object" || Array.isArray(paramsTemplate)) {
        return null;
    }

    for (const [templateKey, templateValue] of Object.entries(paramsTemplate as Record<string, unknown>)) {
        if (templateValue !== "{{identityValue}}") {
            continue;
        }

        const marker = "Condition.";
        const markerIndex = templateKey.lastIndexOf(marker);
        if (markerIndex < 0) {
            continue;
        }

        const fieldName = templateKey.slice(markerIndex + marker.length).trim();
        if (fieldName.length === 0) {
            continue;
        }

        const sourcePrefix = templateKey.slice(0, markerIndex).trim().replace(/\.$/, "");
        return {
            source: sourcePrefix.length > 0 ? sourcePrefix : null,
            fieldName
        };
    }

    return null;
}

function parseImportPayload(rawPayload: string | null | undefined): Record<string, unknown> | null {
    if (!rawPayload) {
        return null;
    }

    try {
        const parsed = JSON.parse(rawPayload);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }

        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

function readImportPayloadField(payload: Record<string, unknown> | null, fieldName: string): string | null {
    if (!payload) {
        return null;
    }

    const value = payload[fieldName];
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

export function resolveImportIin(input: {
    settingsJson: string | null | undefined;
    citizenIdNo: string | null | undefined;
    rawUserPayload: string | null | undefined;
    rawCardPayload: string | null | undefined;
    terminalPersonId: string;
}): string | null {
    const mapping = getImportIinSourceMapping(input.settingsJson);
    if (mapping) {
        const sourcePayload =
            mapping.source === "accessCard"
                ? parseImportPayload(input.rawCardPayload)
                : parseImportPayload(input.rawUserPayload);
        const mappedValue = readImportPayloadField(sourcePayload, mapping.fieldName);
        const normalizedMappedValue = normalizeImportIin(mappedValue);
        if (normalizedMappedValue) {
            return normalizedMappedValue;
        }
    }

    const rawUserPayload = parseImportPayload(input.rawUserPayload);
    const fallbackUserId = readImportPayloadField(rawUserPayload, "UserID");
    const normalizedUserId = normalizeImportIin(fallbackUserId);
    if (normalizedUserId) {
        return normalizedUserId;
    }

    const normalizedCitizenId = normalizeImportIin(input.citizenIdNo);
    if (normalizedCitizenId) {
        return normalizedCitizenId;
    }

    return normalizeImportIin(input.terminalPersonId);
}

export function formatImportPersonName(input: { firstName: string | null; lastName: string | null }) {
    return [input.firstName, input.lastName].filter((value): value is string => Boolean(value)).join(" ").trim() || null;
}

export function computeDirectoryEntryHash(input: {
    deviceId: string;
    terminalPersonId: string;
    iin: string | null;
    displayName: string | null;
    userType: string | null;
    userStatus: string | null;
    authority: string | null;
    validFrom: string | null;
    validTo: string | null;
    cardNo: string | null;
    cardName: string | null;
    sourceSummary: string[];
    rawUserPayload: string | null;
    rawCardPayload: string | null;
}) {
    return createHash("sha1").update(JSON.stringify(input)).digest("hex");
}

export function createImportSummarySeed(): Record<PersonImportCandidateStatusDto, number> {
    return {
        ready_create: 0,
        ready_link: 0,
        already_linked: 0,
        conflict: 0,
        missing_iin: 0,
        stale_terminal_record: 0
    };
}

export function isMissingPersonsImportStorageError(error: unknown) {
    if (!(error instanceof Error)) {
        return false;
    }

    return (
        error.message.includes("no such table: terminal_directory_entries") ||
        error.message.includes("no such table: terminal_directory_sync_runs")
    );
}

export function createPersonsImportStorageHttpError() {
    return new HttpError({
        status: 503,
        code: "persons_import_storage_not_initialized",
        message: "Persons import storage is not initialized. Run database migrations."
    });
}
