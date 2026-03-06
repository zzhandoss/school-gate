import type {
    ApplyPersonsImportInput,
    PersonImportApplyOperation,
    PersonImportCandidateGroup,
    PersonImportCandidateStatus
} from "@/lib/persons/types";

export type PersonsImportAction = "create" | "link" | "reassign" | "skip";

const ACTIONABLE_STATUSES: Array<PersonImportCandidateStatus> = ["ready_create", "ready_link", "conflict"];

export function isActionableStatus(status: PersonImportCandidateStatus) {
    return ACTIONABLE_STATUSES.includes(status);
}

export function formatImportSummary(
    template: string,
    values: { processed: number; devices: number; entries: number; errors: number }
) {
    return template
        .replace("{{processed}}", String(values.processed))
        .replace("{{devices}}", String(values.devices))
        .replace("{{entries}}", String(values.entries))
        .replace("{{errors}}", String(values.errors));
}

export function formatApplySummary(
    template: string,
    values: { applied: number; total: number; conflicts: number; errors: number }
) {
    return template
        .replace("{{applied}}", String(values.applied))
        .replace("{{total}}", String(values.total))
        .replace("{{conflicts}}", String(values.conflicts))
        .replace("{{errors}}", String(values.errors));
}

export function parseDisplayName(displayName: string | null) {
    const value = displayName?.trim() ?? "";
    if (!value) {
        return { firstName: null, lastName: null };
    }

    const chunks = value.split(/\s+/).filter(Boolean);
    if (chunks.length === 1) {
        return { firstName: chunks[0], lastName: null };
    }

    return {
        firstName: chunks[0] ?? null,
        lastName: chunks.slice(1).join(" ") || null
    };
}

function buildCreateOperation(group: PersonImportCandidateGroup): PersonImportApplyOperation | null {
    if (group.status !== "ready_create" || !group.iin) {
        return null;
    }

    const { firstName, lastName } = parseDisplayName(group.displayName);
    return {
        type: "create_person_and_link",
        directoryEntryIds: group.entries.map((entry) => entry.directoryEntryId),
        personDraft: {
            iin: group.iin,
            firstName,
            lastName
        }
    };
}

function buildLinkOperation(group: PersonImportCandidateGroup): PersonImportApplyOperation | null {
    if (group.status !== "ready_link" || !group.suggestedPersonId) {
        return null;
    }

    return {
        type: "link_existing",
        directoryEntryIds: group.entries.map((entry) => entry.directoryEntryId),
        targetPersonId: group.suggestedPersonId
    };
}

function buildReassignOperations(group: PersonImportCandidateGroup): Array<PersonImportApplyOperation> {
    if (group.status !== "conflict" || !group.suggestedPersonId) {
        return [];
    }

    return group.entries
        .filter((entry) => entry.linkedPersonId)
        .map((entry) => ({
            type: "reassign_identity" as const,
            directoryEntryIds: [entry.directoryEntryId],
            targetPersonId: group.suggestedPersonId ?? undefined,
            expectedCurrentPersonId: entry.linkedPersonId
        }));
}

function buildSkipOperation(group: PersonImportCandidateGroup): PersonImportApplyOperation {
    return {
        type: "skip",
        directoryEntryIds: group.entries.map((entry) => entry.directoryEntryId)
    };
}

export function getAvailableActions(groups: Array<PersonImportCandidateGroup>) {
    if (groups.length === 0) {
        return [] as Array<PersonsImportAction>;
    }

    const statuses = new Set(groups.map((group) => group.status));
    if (statuses.size !== 1) {
        return ["skip"] as Array<PersonsImportAction>;
    }

    const [status] = Array.from(statuses);
    if (status === "ready_create") {
        return ["create", "skip"] as Array<PersonsImportAction>;
    }
    if (status === "ready_link") {
        return ["link", "skip"] as Array<PersonsImportAction>;
    }
    if (status === "conflict") {
        return ["reassign", "skip"] as Array<PersonsImportAction>;
    }

    return ["skip"] as Array<PersonsImportAction>;
}

export function buildApplyPayload(
    action: PersonsImportAction,
    groups: Array<PersonImportCandidateGroup>
): ApplyPersonsImportInput {
    const operations = groups.flatMap((group) => {
        if (action === "create") {
            return buildCreateOperation(group) ? [buildCreateOperation(group)!] : [];
        }
        if (action === "link") {
            return buildLinkOperation(group) ? [buildLinkOperation(group)!] : [];
        }
        if (action === "reassign") {
            return buildReassignOperations(group);
        }
        return [buildSkipOperation(group)];
    });

    return { operations };
}
