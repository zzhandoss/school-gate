import crypto from "node:crypto";

export type AdapterMode = "active" | "draining";

export type AdapterCapabilities = string[];

export type AdapterSession = {
    adapterId: string;
    vendorKey: string;
    instanceKey: string;
    instanceName: string;
    baseUrl: string;
    retentionMs: number;
    capabilities: AdapterCapabilities;
    deviceSettingsSchema?: Record<string, unknown>;
    version?: string;
    mode: AdapterMode;
    registeredAt: Date;
    lastSeenAt: Date;
};

export class AdapterInstanceActiveError extends Error {
    constructor() {
        super("Adapter instance is already active");
        this.name = "AdapterInstanceActiveError";
    }
}

type AdapterRegistryOptions = {
    aliveTtlMs?: number;
    now?: () => Date;
};

export class AdapterRegistry {
    private byId = new Map<string, AdapterSession>();
    private activeByVendor = new Map<string, string>();
    private byIdentity = new Map<string, string>();
    private aliveTtlMs: number;
    private now: () => Date;

    constructor(options: AdapterRegistryOptions = {}) {
        this.aliveTtlMs = options.aliveTtlMs ?? 60_000;
        this.now = options.now ?? (() => new Date());
    }

    private toIdentityKey(vendorKey: string, instanceKey: string): string {
        return `${vendorKey}:${instanceKey}`;
    }

    private toDeterministicAdapterId(identityKey: string): string {
        const hash = crypto.createHash("sha256").update(identityKey).digest("hex");
        return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
    }

    private isAlive(session: AdapterSession, now: Date): boolean {
        return now.getTime() - session.lastSeenAt.getTime() <= this.aliveTtlMs;
    }

    private markPreviousActiveAsDraining(vendorKey: string, now: Date, skipAdapterId?: string) {
        const previousId = this.activeByVendor.get(vendorKey);
        if (!previousId || previousId === skipAdapterId) return;

        const previous = this.byId.get(previousId);
        if (!previous) return;

        previous.mode = "draining";
        previous.lastSeenAt = now;
        this.byId.set(previousId, previous);
    }

    register(input: Omit<AdapterSession, "adapterId" | "mode" | "registeredAt" | "lastSeenAt">): AdapterSession {
        const now = this.now();
        const identityKey = this.toIdentityKey(input.vendorKey, input.instanceKey);
        const existingId = this.byIdentity.get(identityKey);
        if (existingId) {
            const existing = this.byId.get(existingId);
            if (!existing) {
                this.byIdentity.delete(identityKey);
            } else {
                if (this.isAlive(existing, now)) {
                    throw new AdapterInstanceActiveError();
                }

                existing.baseUrl = input.baseUrl;
                existing.retentionMs = input.retentionMs;
                existing.capabilities = input.capabilities;
                existing.instanceName = input.instanceName;
                if (input.deviceSettingsSchema === undefined) {
                    delete existing.deviceSettingsSchema;
                } else {
                    existing.deviceSettingsSchema = input.deviceSettingsSchema;
                }
                existing.mode = "active";
                existing.lastSeenAt = now;
                if (input.version === undefined) {
                    delete existing.version;
                } else {
                    existing.version = input.version;
                }

                this.markPreviousActiveAsDraining(input.vendorKey, now, existing.adapterId);
                this.activeByVendor.set(input.vendorKey, existing.adapterId);
                this.byId.set(existing.adapterId, existing);
                return existing;
            }
        }

        const adapterId = this.toDeterministicAdapterId(identityKey);
        const base: AdapterSession = {
            adapterId,
            vendorKey: input.vendorKey,
            instanceKey: input.instanceKey,
            instanceName: input.instanceName,
            baseUrl: input.baseUrl,
            retentionMs: input.retentionMs,
            capabilities: input.capabilities,
            mode: "active",
            registeredAt: now,
            lastSeenAt: now
        };
        if (input.deviceSettingsSchema !== undefined) {
            base.deviceSettingsSchema = input.deviceSettingsSchema;
        }
        const session: AdapterSession =
            input.version === undefined ? base : { ...base, version: input.version };

        this.markPreviousActiveAsDraining(input.vendorKey, now);
        this.activeByVendor.set(input.vendorKey, adapterId);
        this.byIdentity.set(identityKey, adapterId);
        this.byId.set(adapterId, session);
        return session;
    }

    heartbeat(adapterId: string): AdapterSession | null {
        const session = this.byId.get(adapterId);
        if (!session) return null;
        session.lastSeenAt = new Date();
        this.byId.set(adapterId, session);
        return session;
    }

    getSession(adapterId: string): AdapterSession | null {
        return this.byId.get(adapterId) ?? null;
    }

    list(): AdapterSession[] {
        return Array.from(this.byId.values());
    }

    isActive(adapterId: string): boolean {
        const session = this.byId.get(adapterId);
        if (!session) return false;
        return session.mode === "active" && this.activeByVendor.get(session.vendorKey) === adapterId;
    }
}
