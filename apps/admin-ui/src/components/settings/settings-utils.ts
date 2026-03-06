import type { RuntimeField, RuntimeSettingsSnapshot, SetRuntimeSettingsInput } from "@/lib/settings/types";

export type GroupKey = keyof RuntimeSettingsSnapshot;
export type FieldKind = "number" | "string" | "boolean";
export type DraftValue = string | boolean;
export type GroupDraft = Record<string, DraftValue>;
export type SectionState = {
    saving: boolean
    success: string | null
    error: string | null
};
export type GroupValidationError = {
    key: "settings.validation.positiveInteger" | "settings.validation.required";
    fieldKey: string;
};

type FieldDef = {
    key: string
    label: string
    kind: FieldKind
    hint: string
};

export type GroupDef = {
    key: GroupKey
    title: string
    description: string
    fields: Array<FieldDef>
};
export type GroupSnapshot = Record<string, RuntimeField<unknown>>;

export const GROUP_DEFS: Array<GroupDef> = [
    {
        key: "worker",
        title: "Worker",
        description: "Core worker polling and batching behavior.",
        fields: [
            { key: "pollMs", label: "Poll (ms)", kind: "number", hint: "Interval between polling cycles." },
            { key: "batch", label: "Batch size", kind: "number", hint: "Items per cycle." },
            { key: "autoResolvePersonByIin", label: "Auto-resolve by IIN", kind: "boolean", hint: "Enable automatic identity matching by IIN." }
        ]
    },
    {
        key: "outbox",
        title: "Outbox",
        description: "Delivery retries and lease strategy for outbox events.",
        fields: [
            { key: "pollMs", label: "Poll (ms)", kind: "number", hint: "Outbox polling interval." },
            { key: "batch", label: "Batch size", kind: "number", hint: "Rows processed per cycle." },
            { key: "maxAttempts", label: "Max attempts", kind: "number", hint: "Retry attempts before permanent error." },
            { key: "leaseMs", label: "Lease (ms)", kind: "number", hint: "Processing lease timeout." },
            { key: "processingBy", label: "Processing by", kind: "string", hint: "Worker identifier for ownership." }
        ]
    },
    {
        key: "accessEvents",
        title: "Access Events",
        description: "Processing queue behavior for access events.",
        fields: [
            { key: "pollMs", label: "Poll (ms)", kind: "number", hint: "Polling interval for events queue." },
            { key: "batch", label: "Batch size", kind: "number", hint: "Events processed per cycle." },
            { key: "retryDelayMs", label: "Retry delay (ms)", kind: "number", hint: "Delay before retrying failed events." },
            { key: "leaseMs", label: "Lease (ms)", kind: "number", hint: "Processing lease timeout." },
            { key: "maxAttempts", label: "Max attempts", kind: "number", hint: "Retry attempts before permanent error." },
            { key: "processingBy", label: "Processing by", kind: "string", hint: "Worker identifier for ownership." }
        ]
    },
    {
        key: "retention",
        title: "Retention",
        description: "Cleanup schedules and data retention windows.",
        fields: [
            { key: "pollMs", label: "Poll (ms)", kind: "number", hint: "Cleanup scheduler interval." },
            { key: "batch", label: "Batch size", kind: "number", hint: "Rows removed per cleanup cycle." },
            { key: "accessEventsDays", label: "Access events (days)", kind: "number", hint: "Retention window for access events." },
            { key: "auditLogsDays", label: "Audit logs (days)", kind: "number", hint: "Retention window for audit logs." }
        ]
    },
    {
        key: "monitoring",
        title: "Monitoring",
        description: "Worker heartbeat freshness thresholds.",
        fields: [
            { key: "workerTtlMs", label: "Worker TTL (ms)", kind: "number", hint: "Threshold before worker is marked stale." }
        ]
    },
    {
        key: "notifications",
        title: "Notifications",
        description: "Notification template and freshness thresholds.",
        fields: [
            { key: "parentTemplate", label: "Parent template", kind: "string", hint: "Template used for parent notifications." },
            { key: "parentMaxAgeMs", label: "Parent max age (ms)", kind: "number", hint: "Do not send parent notifications older than this age." },
            { key: "alertMaxAgeMs", label: "Alert max age (ms)", kind: "number", hint: "Do not send alert notifications older than this age." }
        ]
    }
];

export function createGroupDraft(group: GroupDef, groupSnapshot: GroupSnapshot) {
    const next: GroupDraft = {};
    for (const field of group.fields) {
        const value = groupSnapshot[field.key].effective;
        next[field.key] = field.kind === "number" ? String(value) : (value as DraftValue);
    }
    return next;
}

export function validateGroup(group: GroupDef, draft: GroupDraft): GroupValidationError | null {
    for (const field of group.fields) {
        const value = draft[field.key];
        if (field.kind === "number") {
            const parsed = Number.parseInt(String(value), 10);
            if (!Number.isInteger(parsed) || parsed <= 0) {
                return { key: "settings.validation.positiveInteger", fieldKey: field.key };
            }
        }
        if (field.kind === "string") {
            if (String(value).trim().length === 0) {
                return { key: "settings.validation.required", fieldKey: field.key };
            }
        }
    }

    return null;
}

export function buildPatchForGroup(
    group: GroupDef,
    groupSnapshot: GroupSnapshot,
    draft: GroupDraft
) {
    const patchFields: Record<string, unknown> = {};
    let changed = false;

    for (const field of group.fields) {
        const current = groupSnapshot[field.key].effective;
        const nextRaw = draft[field.key];
        const nextValue =
            field.kind === "number"
                ? Number.parseInt(String(nextRaw), 10)
                : field.kind === "string"
                    ? String(nextRaw).trim()
                    : Boolean(nextRaw);

        if (current !== nextValue) {
            changed = true;
            patchFields[field.key] = nextValue;
        }
    }

    if (!changed) {
        return null;
    }

    return { [group.key]: patchFields } as SetRuntimeSettingsInput;
}

export function isGroupChanged(
    group: GroupDef,
    groupSnapshot: GroupSnapshot,
    draft: GroupDraft
) {
    return buildPatchForGroup(group, groupSnapshot, draft) !== null;
}
