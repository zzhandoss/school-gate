import type { AdapterAccessEvent, DeviceAdapterClient } from "@school-gate/device/core/ports/deviceAdapterClient";

export type DeviceAdapterIdentityClient = {
    findIdentity(input: {
        deviceId: string;
        identityKey: string;
        identityValue: string;
        limit?: number;
    }): Promise<{
        terminalPersonId: string;
        firstName?: string | null;
        lastName?: string | null;
        score?: number | null;
        rawPayload?: string | null;
        displayName?: string | null;
        source?: string | null;
        userType?: string | null;
    } | null>;
    exportUsers(input: {
        target:
            | { mode: "device"; deviceId: string }
            | { mode: "devices"; deviceIds: string[] }
            | { mode: "allAssigned" };
        view: "flat" | "grouped";
        limit: number;
        offset: number;
        includeCards: boolean;
    }): Promise<
        | {
            view: "flat";
            users: Array<{
                deviceId: string;
                terminalPersonId: string;
                sourceSummary: string[];
                displayName?: string | null;
                userType?: string | null;
                userStatus?: string | null;
                authority?: string | null;
                citizenIdNo?: string | null;
                validFrom?: string | null;
                validTo?: string | null;
                cardNo?: string | null;
                cardName?: string | null;
                rawUserPayload?: string | null;
                rawCardPayload?: string | null;
            }>;
            devices: Array<{
                deviceId: string;
                exportedCount: number;
                failed: boolean;
                hasMore: boolean;
                errorCode?: string | null;
                errorMessage?: string | null;
            }>;
        }
        | {
            view: "grouped";
            devices: Array<{
                deviceId: string;
                exportedCount: number;
                failed: boolean;
                hasMore: boolean;
                errorCode?: string | null;
                errorMessage?: string | null;
                users: Array<{
                    deviceId: string;
                    terminalPersonId: string;
                    sourceSummary: string[];
                    displayName?: string | null;
                    userType?: string | null;
                    userStatus?: string | null;
                    authority?: string | null;
                    citizenIdNo?: string | null;
                    validFrom?: string | null;
                    validTo?: string | null;
                    cardNo?: string | null;
                    cardName?: string | null;
                    rawUserPayload?: string | null;
                    rawCardPayload?: string | null;
                }>;
            }>;
        }
    >;
    writeUsers(input: {
        operation: "create" | "update";
        target:
            | { mode: "device"; deviceId: string }
            | { mode: "devices"; deviceIds: string[] }
            | { mode: "allAssigned" };
        person: {
            userId: string;
            displayName: string;
            userType?: number | null | undefined;
            userStatus?: number | null | undefined;
            authority?: number | null | undefined;
            citizenIdNo?: string | null | undefined;
            password?: string | null | undefined;
            useTime?: number | null | undefined;
            isFirstEnter?: boolean | null | undefined;
            firstEnterDoors?: number[] | null | undefined;
            doors?: number[] | null | undefined;
            timeSections?: number[] | null | undefined;
            specialDaysSchedule?: unknown | null | undefined;
            validFrom?: string | null | undefined;
            validTo?: string | null | undefined;
            card?: {
                cardNo: string;
                cardName?: string | null | undefined;
                cardType?: number | null | undefined;
                cardStatus?: number | null | undefined;
            } | undefined;
            face?: {
                photosBase64?: string[] | null | undefined;
                photoUrls?: string[] | null | undefined;
            } | undefined;
        };
    }): Promise<{
        results: Array<{
            deviceId: string;
            operation: "create" | "update";
            status: "success" | "failed";
            steps: {
                accessUser: "success" | "failed" | "skipped";
                accessCard: "success" | "failed" | "skipped";
                accessFace: "success" | "failed" | "skipped";
            };
            errorCode?: string | null;
            errorMessage?: string | null;
        }>;
    }>;
    bulkCreateUsers(input: {
        target:
            | { mode: "device"; deviceId: string }
            | { mode: "devices"; deviceIds: string[] }
            | { mode: "allAssigned" };
        persons: Array<{
            userId: string;
            displayName: string;
            userType?: number | null | undefined;
            userStatus?: number | null | undefined;
            authority?: number | null | undefined;
            citizenIdNo?: string | null | undefined;
            password?: string | null | undefined;
            useTime?: number | null | undefined;
            isFirstEnter?: boolean | null | undefined;
            firstEnterDoors?: number[] | null | undefined;
            doors?: number[] | null | undefined;
            timeSections?: number[] | null | undefined;
            specialDaysSchedule?: unknown | null | undefined;
            validFrom?: string | null | undefined;
            validTo?: string | null | undefined;
            card?: {
                cardNo: string;
                cardName?: string | null | undefined;
                cardType?: number | null | undefined;
                cardStatus?: number | null | undefined;
            } | undefined;
            face?: {
                photosBase64?: string[] | null | undefined;
                photoUrls?: string[] | null | undefined;
            } | undefined;
        }>;
    }): Promise<{
        results: Array<{
            userId: string;
            deviceId: string;
            operation: "create";
            status: "success" | "failed" | "skipped";
            steps: {
                accessUser: "success" | "failed" | "skipped";
                accessCard: "success" | "failed" | "skipped";
                accessFace: "success" | "failed" | "skipped";
            };
            errorCode?: string | null;
            errorMessage?: string | null;
            skipCode?: string | null;
            skipMessage?: string | null;
        }>;
    }>;
    getUserPhoto(input: {
        target: { mode: "device"; deviceId: string };
        userId: string;
    }): Promise<{
        photo: {
            deviceId: string;
            userId: string;
            photoData?: string[] | null;
            photoUrl?: string[] | null;
            faceData?: string[] | null;
        };
    }>;
};

type DeviceAdapterHttpClientConfig = {
    baseUrl: string;
    token: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
};

type FetchEventsRequest = {
    deviceId: string;
    sinceEventId?: string | null;
    limit: number;
};

type FetchEventsResponse = {
    events: Array<{
        deviceId: string;
        eventId: string;
        direction: "IN" | "OUT";
        occurredAt: number;
        terminalPersonId?: string | null;
        rawPayload?: string | null;
    }>;
};

type EnvelopeError = {
    code?: string;
    message?: string;
    data?: unknown;
};

type EnvelopeResponse<T> = {
    success: boolean;
    data?: T;
    error?: EnvelopeError;
};

type FindIdentityRequest = {
    deviceId: string;
    identityKey: string;
    identityValue: string;
    limit?: number;
};

type FindIdentityMatch = {
    terminalPersonId: string;
    firstName?: string | null;
    lastName?: string | null;
    score?: number;
    rawPayload?: string | null;
    displayName?: string | null;
    source?: string | null;
    userType?: string | null;
};

type FindIdentityResponse = {
    matches: FindIdentityMatch[];
};

type ExportUsersUser = {
    deviceId: string;
    terminalPersonId: string;
    sourceSummary: string[];
    displayName?: string | null;
    userType?: string | null;
    userStatus?: string | null;
    authority?: string | null;
    citizenIdNo?: string | null;
    validFrom?: string | null;
    validTo?: string | null;
    cardNo?: string | null;
    cardName?: string | null;
    rawUserPayload?: string | null;
    rawCardPayload?: string | null;
};

type ExportUsersResponse =
    | {
        view: "flat";
        users: ExportUsersUser[];
        devices: Array<{
            deviceId: string;
            exportedCount: number;
            failed: boolean;
            hasMore?: boolean;
            errorCode?: string | null;
            errorMessage?: string | null;
        }>;
    }
    | {
        view: "grouped";
        devices: Array<{
            deviceId: string;
            exportedCount: number;
            failed: boolean;
            hasMore?: boolean;
            errorCode?: string | null;
            errorMessage?: string | null;
            users?: ExportUsersUser[];
        }>;
    };

type WriteUsersResponse = {
    results: Array<{
        deviceId: string;
        operation: "create" | "update";
        status: "success" | "failed";
        steps: {
            accessUser: "success" | "failed" | "skipped";
            accessCard: "success" | "failed" | "skipped";
            accessFace: "success" | "failed" | "skipped";
        };
        errorCode?: string | null;
        errorMessage?: string | null;
    }>;
};

type BulkCreateUsersResponse = {
    results: Array<{
        userId: string;
        deviceId: string;
        operation: "create";
        status: "success" | "failed" | "skipped";
        steps: {
            accessUser: "success" | "failed" | "skipped";
            accessCard: "success" | "failed" | "skipped";
            accessFace: "success" | "failed" | "skipped";
        };
        errorCode?: string | null;
        errorMessage?: string | null;
        skipCode?: string | null;
        skipMessage?: string | null;
    }>;
};

type GetUserPhotoResponse = {
    photo: {
        deviceId: string;
        userId: string;
        photoData?: string[] | null;
        photoUrl?: string[] | null;
        faceData?: string[] | null;
    };
};

function withTimeout<T>(timeoutMs: number, cb: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return cb(controller.signal).finally(() => clearTimeout(timer));
}

function unwrapEnvelope<T>(json: unknown): T {
    if (json && typeof json === "object" && "success" in json) {
        const envelope = json as EnvelopeResponse<T>;
        if (!envelope.success) {
            const code = envelope.error?.code ?? "adapter_error";
            const message = envelope.error?.message ?? "Adapter returned failure envelope";
            throw new Error(`${code}: ${message}`);
        }
        return (envelope.data ?? ({} as T)) as T;
    }
    return json as T;
}

function toErrorDetails(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "string") {
        return value;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

async function readAdapterFailureDetails(response: Response): Promise<string> {
    const rawText = (await response.text()).trim();
    if (!rawText) {
        return "";
    }

    try {
        const parsed = JSON.parse(rawText) as EnvelopeResponse<unknown> | Record<string, unknown>;
        if (parsed && typeof parsed === "object" && "success" in parsed) {
            const envelope = parsed as EnvelopeResponse<unknown>;
            if (envelope.success === false) {
                const code = envelope.error?.code ?? "adapter_error";
                const message = envelope.error?.message ?? "Adapter returned failure envelope";
                const details = toErrorDetails(envelope.error?.data);
                return details ? `${code}: ${message}; data=${details}` : `${code}: ${message}`;
            }
        }
        return toErrorDetails(parsed);
    } catch {
        return rawText;
    }
}

function normalizeOptionalText(value: string | null | undefined): string | null | undefined {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return value.trim().length === 0 ? null : value;
}

function normalizeStringArray(values: string[] | null | undefined): string[] {
    if (!Array.isArray(values)) {
        return [];
    }
    return values
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
}

function normalizeOptionalStringList(values: string[] | null | undefined): string[] | null | undefined {
    if (values === undefined) {
        return undefined;
    }
    if (values === null) {
        return null;
    }
    const normalized = normalizeStringArray(values);
    return normalized.length > 0 ? normalized : null;
}

function normalizeExportUser(user: ExportUsersUser): ExportUsersUser {
    const displayName = normalizeOptionalText(user.displayName);
    const userType = normalizeOptionalText(user.userType);
    const userStatus = normalizeOptionalText(user.userStatus);
    const authority = normalizeOptionalText(user.authority);
    const citizenIdNo = normalizeOptionalText(user.citizenIdNo);
    const validFrom = normalizeOptionalText(user.validFrom);
    const validTo = normalizeOptionalText(user.validTo);
    const cardNo = normalizeOptionalText(user.cardNo);
    const cardName = normalizeOptionalText(user.cardName);
    const rawUserPayload = normalizeOptionalText(user.rawUserPayload);
    const rawCardPayload = normalizeOptionalText(user.rawCardPayload);

    return {
        sourceSummary: normalizeStringArray(user.sourceSummary),
        deviceId: user.deviceId,
        terminalPersonId: user.terminalPersonId,
        ...(displayName !== undefined ? { displayName } : {}),
        ...(userType !== undefined ? { userType } : {}),
        ...(userStatus !== undefined ? { userStatus } : {}),
        ...(authority !== undefined ? { authority } : {}),
        ...(citizenIdNo !== undefined ? { citizenIdNo } : {}),
        ...(validFrom !== undefined ? { validFrom } : {}),
        ...(validTo !== undefined ? { validTo } : {}),
        ...(cardNo !== undefined ? { cardNo } : {}),
        ...(cardName !== undefined ? { cardName } : {}),
        ...(rawUserPayload !== undefined ? { rawUserPayload } : {}),
        ...(rawCardPayload !== undefined ? { rawCardPayload } : {})
    };
}

function normalizeExportDeviceResult<TDevice extends {
    hasMore?: boolean;
    errorCode?: string | null;
    errorMessage?: string | null;
}>(device: TDevice): TDevice & {
    hasMore: boolean;
    errorCode?: string | null;
    errorMessage?: string | null;
} {
    const errorCode = normalizeOptionalText(device.errorCode);
    const errorMessage = normalizeOptionalText(device.errorMessage);

    return {
        ...device,
        hasMore: device.hasMore ?? false,
        ...(errorCode !== undefined ? { errorCode } : {}),
        ...(errorMessage !== undefined ? { errorMessage } : {})
    };
}

export function createDeviceAdapterHttpClient(
    config: DeviceAdapterHttpClientConfig
): DeviceAdapterClient & DeviceAdapterIdentityClient {
    const fetchImpl = config.fetchImpl ?? fetch;
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const timeoutMs = config.timeoutMs ?? 5_000;

    return {
        async fetchEvents(input: FetchEventsRequest): Promise<AdapterAccessEvent[]> {
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}/events/backfill`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`
                    },
                    body: JSON.stringify({
                        deviceId: input.deviceId,
                        sinceEventId: input.sinceEventId ?? null,
                        limit: input.limit
                    }),
                    signal
                });
            });

            if (!response.ok) {
                throw new Error(`Adapter fetchEvents failed with status ${response.status}`);
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<FetchEventsResponse>(raw);
            if (!payload || !Array.isArray(payload.events)) {
                throw new Error("Adapter fetchEvents returned invalid payload");
            }

            return payload.events.map((event) => ({
                deviceId: event.deviceId,
                eventId: event.eventId,
                direction: event.direction,
                occurredAt: new Date(event.occurredAt),
                terminalPersonId: event.terminalPersonId ?? null,
                rawPayload: event.rawPayload ?? null
            }));
        },
        async findIdentity(input: FindIdentityRequest) {
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}/identity/find`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`
                    },
                    body: JSON.stringify({
                        deviceId: input.deviceId,
                        identityKey: input.identityKey,
                        identityValue: input.identityValue,
                        limit: input.limit && input.limit > 0 ? input.limit : 1
                    }),
                    signal
                });
            });
            if (!response.ok) {
                throw new Error(`Adapter findIdentity failed with status ${response.status}`);
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<FindIdentityResponse>(raw);
            if (!payload || !Array.isArray(payload.matches)) {
                throw new Error("Adapter findIdentity returned invalid payload");
            }

            if (payload.matches.length === 0) {
                return null;
            }

            const first = payload.matches[0];
            if (!first || typeof first.terminalPersonId !== "string" || first.terminalPersonId.length === 0) {
                throw new Error("Adapter findIdentity returned invalid terminalPersonId");
            }
            return {
                terminalPersonId: first.terminalPersonId,
                ...(first.firstName !== undefined ? { firstName: first.firstName } : {}),
                ...(first.lastName !== undefined ? { lastName: first.lastName } : {}),
                ...(first.score !== undefined ? { score: first.score } : {}),
                ...(first.rawPayload !== undefined ? { rawPayload: first.rawPayload } : {}),
                ...(first.displayName !== undefined ? { displayName: first.displayName } : {}),
                ...(first.source !== undefined ? { source: first.source } : {}),
                ...(first.userType !== undefined ? { userType: first.userType } : {})
            };
        },
        async exportUsers(input) {
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}/identity/export-users`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`
                    },
                    body: JSON.stringify({
                        target: input.target,
                        view: input.view,
                        limit: input.limit,
                        offset: input.offset,
                        includeCards: input.includeCards
                    }),
                    signal
                });
            });
            if (!response.ok) {
                const details = await readAdapterFailureDetails(response);
                throw new Error(
                    details
                        ? `Adapter exportUsers failed with status ${response.status}: ${details}`
                        : `Adapter exportUsers failed with status ${response.status}`
                );
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<ExportUsersResponse>(raw);
            if (!payload || (payload.view !== "flat" && payload.view !== "grouped")) {
                throw new Error("Adapter exportUsers returned invalid payload");
            }

            if (payload.view === "flat") {
                if (!Array.isArray(payload.users) || !Array.isArray(payload.devices)) {
                    throw new Error("Adapter exportUsers returned invalid flat payload");
                }
                return {
                    view: "flat" as const,
                    users: payload.users.map((user) => normalizeExportUser(user)),
                    devices: payload.devices.map((device) => normalizeExportDeviceResult(device))
                };
            }

            if (!Array.isArray(payload.devices)) {
                throw new Error("Adapter exportUsers returned invalid grouped payload");
            }
            return {
                view: "grouped" as const,
                devices: payload.devices.map((device) => ({
                    ...normalizeExportDeviceResult(device),
                    users: (device.users ?? []).map((user) => normalizeExportUser(user))
                }))
            };
        },
        async writeUsers(input) {
            const endpoint = input.operation === "create" ? "/identity/users/create" : "/identity/users/update";
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}${endpoint}`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`
                    },
                    body: JSON.stringify({
                        target: input.target,
                        person: input.person
                    }),
                    signal
                });
            });
            if (!response.ok) {
                throw new Error(`Adapter writeUsers failed with status ${response.status}`);
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<WriteUsersResponse>(raw);
            if (!payload || !Array.isArray(payload.results)) {
                throw new Error("Adapter writeUsers returned invalid payload");
            }

            return {
                results: payload.results.map((result) => ({
                    ...result,
                    steps: {
                        accessUser: result.steps.accessUser,
                        accessCard: result.steps.accessCard,
                        accessFace: result.steps.accessFace
                    }
                }))
            };
        },
        async bulkCreateUsers(input) {
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}/identity/users/bulk-create`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`
                    },
                    body: JSON.stringify({
                        target: input.target,
                        persons: input.persons
                    }),
                    signal
                });
            });
            if (!response.ok) {
                const details = await readAdapterFailureDetails(response);
                throw new Error(
                    details
                        ? `Adapter bulkCreateUsers failed with status ${response.status}: ${details}`
                        : `Adapter bulkCreateUsers failed with status ${response.status}`
                );
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<BulkCreateUsersResponse>(raw);
            if (!payload || !Array.isArray(payload.results)) {
                throw new Error("Adapter bulkCreateUsers returned invalid payload");
            }

            return {
                results: payload.results.map((result) => ({
                    ...result,
                    steps: {
                        accessUser: result.steps.accessUser,
                        accessCard: result.steps.accessCard,
                        accessFace: result.steps.accessFace
                    }
                }))
            };
        },
        async getUserPhoto(input) {
            const response = await withTimeout(timeoutMs, async (signal) => {
                return fetchImpl(`${baseUrl}/identity/users/photo/get`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        authorization: `Bearer ${config.token}`
                    },
                    body: JSON.stringify({
                        target: input.target,
                        userId: input.userId
                    }),
                    signal
                });
            });

            if (!response.ok) {
                const details = await readAdapterFailureDetails(response);
                throw new Error(
                    details
                        ? `Adapter getUserPhoto failed with status ${response.status}: ${details}`
                        : `Adapter getUserPhoto failed with status ${response.status}`
                );
            }

            const raw = await response.json();
            const payload = unwrapEnvelope<GetUserPhotoResponse>(raw);
            if (!payload?.photo || typeof payload.photo.deviceId !== "string" || typeof payload.photo.userId !== "string") {
                throw new Error("Adapter getUserPhoto returned invalid payload");
            }

            const photoData = normalizeOptionalStringList(payload.photo.photoData);
            const photoUrl = normalizeOptionalStringList(payload.photo.photoUrl);
            const faceData = normalizeOptionalStringList(payload.photo.faceData);

            return {
                photo: {
                    deviceId: payload.photo.deviceId,
                    userId: payload.photo.userId,
                    ...(photoData !== undefined ? { photoData } : {}),
                    ...(photoUrl !== undefined ? { photoUrl } : {}),
                    ...(faceData !== undefined ? { faceData } : {})
                }
            };
        }
    };
}
