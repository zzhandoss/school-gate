import type { PersonImportCandidateEntry, PersonItem } from "@/lib/persons/types";

export type PersonTerminalWriteDraft = {
    terminalPersonId: string
    displayName: string
    citizenIdNo: string
    userType: string
    userStatus: string
    authority: string
    validFrom: string
    validTo: string
    cardNo: string
    cardName: string
    cardType: string
    cardStatus: string
};

export type TerminalWriteSummaryField = {
    label: string
    value: string
};

export type TerminalWritePreload = {
    draft: PersonTerminalWriteDraft
    warnings: Array<string>
    loadedCount: number
};

function pad(value: number) {
    return String(value).padStart(2, "0");
}

function normalizeOptionalText(value: string | null | undefined) {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : "";
}

function toDateTimeLocalValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createDefaultTerminalValidityWindow() {
    const now = new Date();
    const nextYear = new Date(now);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    return {
        validFrom: toDateTimeLocalValue(now),
        validTo: toDateTimeLocalValue(nextYear)
    };
}

export function createDefaultTerminalWriteDraft(person: PersonItem): PersonTerminalWriteDraft {
    const validity = createDefaultTerminalValidityWindow();

    return {
        terminalPersonId: person.terminalPersonId?.trim() || person.iin,
        displayName: [person.firstName, person.lastName].filter(Boolean).join(" ").trim() || person.iin,
        citizenIdNo: person.iin,
        userType: "0",
        userStatus: "0",
        authority: "2",
        validFrom: validity.validFrom,
        validTo: validity.validTo,
        cardNo: "",
        cardName: "",
        cardType: "0",
        cardStatus: "0"
    };
}

function adapterDateToLocal(value: string | null | undefined) {
    const normalized = normalizeOptionalText(value);
    if (!normalized) {
        return "";
    }
    if (normalized.includes("T")) {
        return normalized.slice(0, 16);
    }
    return normalized.replace(" ", "T").slice(0, 16);
}

function chooseField(
    entries: Array<PersonImportCandidateEntry>,
    selector: (entry: PersonImportCandidateEntry) => string,
    warning: string,
    warnings: Array<string>
) {
    const values = Array.from(new Set(entries.map(selector).map((value) => value.trim()).filter(Boolean)));
    if (values.length > 1) {
        warnings.push(warning);
    }
    return values[0] ?? "";
}

export function createTerminalWritePreload(input: {
    person: PersonItem
    entries: Array<PersonImportCandidateEntry>
    missingDeviceCount: number
    missingWarning: string
    mismatchWarnings: {
        terminalPersonId: string
        displayName: string
        citizenIdNo: string
        userType: string
        userStatus: string
        authority: string
        validFrom: string
        validTo: string
        cardNo: string
        cardName: string
        cardType: string
        cardStatus: string
    }
}): TerminalWritePreload {
    const warnings: Array<string> = [];
    const defaults = createDefaultTerminalWriteDraft(input.person);
    const entries = input.entries;

    if (input.missingDeviceCount > 0) {
        warnings.push(input.missingWarning.replace("{{count}}", String(input.missingDeviceCount)));
    }

    if (entries.length === 0) {
        return {
            draft: defaults,
            warnings,
            loadedCount: 0
        };
    }

    return {
        draft: {
            terminalPersonId: chooseField(entries, (entry) => normalizeOptionalText(entry.terminalPersonId), input.mismatchWarnings.terminalPersonId, warnings) || defaults.terminalPersonId,
            displayName: chooseField(entries, (entry) => normalizeOptionalText(entry.displayName), input.mismatchWarnings.displayName, warnings) || defaults.displayName,
            citizenIdNo: chooseField(entries, (entry) => normalizeOptionalText(entry.iin), input.mismatchWarnings.citizenIdNo, warnings) || defaults.citizenIdNo,
            userType: chooseField(entries, (entry) => normalizeOptionalText(entry.userType), input.mismatchWarnings.userType, warnings) || defaults.userType,
            userStatus: chooseField(entries, (entry) => normalizeOptionalText(entry.userStatus), input.mismatchWarnings.userStatus, warnings) || defaults.userStatus,
            authority: chooseField(entries, (entry) => normalizeOptionalText(entry.authority), input.mismatchWarnings.authority, warnings) || defaults.authority,
            validFrom: chooseField(entries, (entry) => adapterDateToLocal(entry.validFrom), input.mismatchWarnings.validFrom, warnings) || defaults.validFrom,
            validTo: chooseField(entries, (entry) => adapterDateToLocal(entry.validTo), input.mismatchWarnings.validTo, warnings) || defaults.validTo,
            cardNo: chooseField(entries, (entry) => normalizeOptionalText(entry.cardNo), input.mismatchWarnings.cardNo, warnings),
            cardName: chooseField(entries, (entry) => normalizeOptionalText(entry.cardName), input.mismatchWarnings.cardName, warnings),
            cardType: chooseField(entries, () => "", input.mismatchWarnings.cardType, warnings) || defaults.cardType,
            cardStatus: chooseField(entries, () => "", input.mismatchWarnings.cardStatus, warnings) || defaults.cardStatus
        },
        warnings,
        loadedCount: entries.length
    };
}

export function toTerminalDateTime(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const normalized = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    return normalized.replace("T", " ");
}

export function toOptionalInt(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number(trimmed);
    return Number.isInteger(parsed) ? parsed : null;
}

export function buildWriteSummaryFields(input: {
    draft: PersonTerminalWriteDraft
    labels: {
        displayName: string
        citizenIdNo: string
        terminalPersonId: string
        userType: string
        userStatus: string
        authority: string
        validFrom: string
        validTo: string
        cardNo: string
        cardName: string
        cardType: string
        cardStatus: string
    }
    notSet: string
}) {
    const valueOrFallback = (value: string) => {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : input.notSet;
    };

    return [
        { label: input.labels.displayName, value: valueOrFallback(input.draft.displayName) },
        { label: input.labels.citizenIdNo, value: valueOrFallback(input.draft.citizenIdNo) },
        { label: input.labels.terminalPersonId, value: valueOrFallback(input.draft.terminalPersonId) },
        { label: input.labels.userType, value: valueOrFallback(input.draft.userType) },
        { label: input.labels.userStatus, value: valueOrFallback(input.draft.userStatus) },
        { label: input.labels.authority, value: valueOrFallback(input.draft.authority) },
        { label: input.labels.validFrom, value: valueOrFallback(toTerminalDateTime(input.draft.validFrom) ?? "") },
        { label: input.labels.validTo, value: valueOrFallback(toTerminalDateTime(input.draft.validTo) ?? "") },
        { label: input.labels.cardNo, value: valueOrFallback(input.draft.cardNo) },
        { label: input.labels.cardName, value: valueOrFallback(input.draft.cardName) },
        { label: input.labels.cardType, value: valueOrFallback(input.draft.cardType) },
        { label: input.labels.cardStatus, value: valueOrFallback(input.draft.cardStatus) }
    ] satisfies Array<TerminalWriteSummaryField>;
}
