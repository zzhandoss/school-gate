import type { AdapterSession } from "./adapterRegistry.js";
import type { AdapterAssignment } from "@school-gate/device/core/usecases/listAdapterAssignments";
import type { BackfillDeviceEventsResult } from "@school-gate/device/core/usecases/backfillDeviceEvents";

export type BackfillRunnerDeps = {
    listAssignments: (vendorKey: string) => { devices: AdapterAssignment[] };
    createBackfillForAdapter: (baseUrl: string) => (input: {
        deviceId: string;
        limit: number;
    }) => Promise<BackfillDeviceEventsResult>;
    now: () => Date;
    minIntervalMs: number;
    limit: number;
};

export type BackfillRunnerResult =
    | { status: "skipped"; reason: "inactive" | "no_capability" | "throttled" }
    | { status: "ok"; devices: number; fetched: number };

export function createAdapterBackfillRunner(deps: BackfillRunnerDeps) {
    const lastRun = new Map<string, Date>();

    return async function runBackfill(session: AdapterSession): Promise<BackfillRunnerResult> {
        if (session.mode !== "active") return { status: "skipped", reason: "inactive" };
        if (!session.capabilities.includes("fetchEvents")) return { status: "skipped", reason: "no_capability" };

        const now = deps.now();
        const last = lastRun.get(session.adapterId);
        if (last && now.getTime() - last.getTime() < deps.minIntervalMs) {
            return { status: "skipped", reason: "throttled" };
        }

        lastRun.set(session.adapterId, now);

        const assignments = deps.listAssignments(session.vendorKey).devices;
        if (assignments.length === 0) {
            return { status: "ok", devices: 0, fetched: 0 };
        }

        const backfillDeviceEvents = deps.createBackfillForAdapter(session.baseUrl);

        let totalFetched = 0;
        for (const device of assignments) {
            const result = await backfillDeviceEvents({
                deviceId: device.deviceId,
                limit: deps.limit,
            });
            totalFetched += result.fetched;
        }

        return { status: "ok", devices: assignments.length, fetched: totalFetched };
    };
}
