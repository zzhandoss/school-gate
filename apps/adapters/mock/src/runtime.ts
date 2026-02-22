import crypto from "node:crypto";
import type { createAdapterEventsRepo } from "./eventsRepo.js";
import type { PeopleCatalog } from "./peopleCatalog.js";
import type { AdapterAccessEvent, AdapterAssignment } from "./types.js";
import { createDeviceServiceClient } from "./deviceServiceClient.js";

export type AdapterRuntimeConfig = {
    vendorKey: string;
    instanceKey: string;
    instanceName: string;
    baseUrl: string;
    retentionMs: number;
    retentionSweepMs: number;
    eventIntervalMs: number;
    pushIntervalMs: number;
    batchLimit: number;
    version?: string;
};

type AdapterState = {
    adapterId: string;
    mode: "active" | "draining";
    heartbeatIntervalMs: number;
    batchLimit: number;
    devices: AdapterAssignment[];
};

type AdapterRuntimeDeps = {
    config: AdapterRuntimeConfig;
    eventsRepo: ReturnType<typeof createAdapterEventsRepo>;
    deviceServiceClient: ReturnType<typeof createDeviceServiceClient>;
    peopleCatalog: PeopleCatalog;
    now?: () => number;
    idFactory?: () => string;
    sleep?: (ms: number) => Promise<void>;
    random?: () => number;
};

export function createAdapterRuntime(deps: AdapterRuntimeDeps) {
    const now = deps.now ?? (() => Date.now());
    const idFactory = deps.idFactory ?? (() => crypto.randomUUID());
    const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    const random = deps.random ?? (() => Math.random());
    let state: AdapterState | null = null;
    let stopped = false;
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let pushTimer: NodeJS.Timeout | null = null;
    let generateTimer: NodeJS.Timeout | null = null;
    let retentionTimer: NodeJS.Timeout | null = null;
    let isPushing = false;
    let isGenerating = false;

    function updateState(next: AdapterState) {
        state = next;
    }

    function scheduleHeartbeat(delayMs: number) {
        if (stopped) return;
        if (heartbeatTimer) {
            clearTimeout(heartbeatTimer);
        }
        heartbeatTimer = setTimeout(() => {
            void heartbeatOnce();
        }, delayMs);
    }

    async function registerOnce() {
        const assignments = await deps.deviceServiceClient.register({
            vendorKey: deps.config.vendorKey,
            instanceKey: deps.config.instanceKey,
            instanceName: deps.config.instanceName,
            baseUrl: deps.config.baseUrl,
            retentionMs: deps.config.retentionMs,
            version: deps.config.version!,
            capabilities: ["fetchEvents"]
        });
        updateState({
            adapterId: assignments.adapterId,
            mode: assignments.mode,
            heartbeatIntervalMs: assignments.heartbeatIntervalMs,
            batchLimit: assignments.batchLimit,
            devices: assignments.devices
        });
        scheduleHeartbeat(assignments.heartbeatIntervalMs);
    }

    async function registerWithRetry() {
        try {
            await registerOnce();
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[adapter-mock] register failed", err);
            scheduleHeartbeat(5_000);
        }
    }

    async function heartbeatOnce() {
        if (stopped) return;
        if (!state) {
            return registerWithRetry();
        }
        try {
            const assignments = await deps.deviceServiceClient.heartbeat(state.adapterId);
            updateState({
                adapterId: assignments.adapterId,
                mode: assignments.mode,
                heartbeatIntervalMs: assignments.heartbeatIntervalMs,
                batchLimit: assignments.batchLimit,
                devices: assignments.devices
            });
            scheduleHeartbeat(assignments.heartbeatIntervalMs);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[adapter-mock] heartbeat failed", err);
            scheduleHeartbeat(5_000);
        }
    }

    function pickEventsCount() {
        return Math.floor(random() * 5) + 1;
    }

    function createEvent(device: AdapterAssignment, terminalPersonId: string, personCode: string, personName: string): AdapterAccessEvent {
        const occurredAt = now();
        return {
            eventId: idFactory(),
            deviceId: device.deviceId,
            direction: device.direction,
            occurredAt,
            terminalPersonId,
            rawPayload: JSON.stringify({
                deviceId: device.deviceId,
                direction: device.direction,
                occurredAt,
                personCode,
                personName
            })
        };
    }

    async function generateForDevice(device: AdapterAssignment) {
        const count = pickEventsCount();
        const people = deps.peopleCatalog.pickRandomPeople(count);
        for (let index = 0; index < people.length; index += 1) {
            const person = people[index]!;
            const terminalPersonId = deps.peopleCatalog.resolveTerminalPersonId(person);
            const event = createEvent(device, terminalPersonId, person.code, person.fullName);
            deps.eventsRepo.insert(event);
            if (index < people.length - 1) {
                await sleep(1_000);
            }
        }
    }

    async function runGenerationCycle() {
        if (isGenerating) return;
        if (!state || state.mode !== "active") return;
        if (state.devices.length === 0) return;

        isGenerating = true;
        try {
            await Promise.all(state.devices.map((device) => generateForDevice(device)));
        } finally {
            isGenerating = false;
        }
    }

    async function pushOnce() {
        if (!state || state.mode !== "active") return;
        if (isPushing) return;
        isPushing = true;
        try {
            const deviceIds = state.devices.map((device) => device.deviceId);
            const limit = Math.min(state.batchLimit, deps.config.batchLimit);
            const pending = deps.eventsRepo.listUnsentForDevices(deviceIds, limit);
            if (pending.length === 0) return;

            const events = pending.map((event) => ({
                eventId: event.eventId,
                deviceId: event.deviceId,
                direction: event.direction,
                occurredAt: event.occurredAt,
                terminalPersonId: event.terminalPersonId,
                rawPayload: event.rawPayload
            }));

            const response = await deps.deviceServiceClient.pushEvents(state.adapterId, events);
            const accepted = response.results
                .filter((result) => result.result === "inserted" || result.result === "duplicate")
                .map((result) => result.eventId);

            if (accepted.length > 0) {
                deps.eventsRepo.markSent(accepted, now());
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("[adapter-mock] push failed", err);
        } finally {
            isPushing = false;
        }
    }

    function startTimers() {
        pushTimer = setInterval(() => void pushOnce(), deps.config.pushIntervalMs);
        generateTimer = setInterval(() => void runGenerationCycle(), deps.config.eventIntervalMs);
        retentionTimer = setInterval(() => {
            deps.eventsRepo.deleteOlderThan(now() - deps.config.retentionMs);
        }, deps.config.retentionSweepMs);
    }

    function stopTimers() {
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        if (pushTimer) clearInterval(pushTimer);
        if (generateTimer) clearInterval(generateTimer);
        if (retentionTimer) clearInterval(retentionTimer);
    }

    return {
        start() {
            stopped = false;
            void registerWithRetry();
            startTimers();
        },
        stop() {
            stopped = true;
            stopTimers();
        }
    };
}

