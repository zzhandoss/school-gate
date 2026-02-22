import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDeviceTestDb } from "../helpers/deviceTestDb.js";
import { deviceCursors, devices as devicesTable } from "@school-gate/device/device-db/schema/index";
import { createDeviceCursorsRepo } from "@school-gate/device/infra/drizzle/repos/deviceCursors.repo";
import { createDevicesRepo } from "@school-gate/device/infra/drizzle/repos/devices.repo";
import { createListAdapterAssignmentsUC } from "@school-gate/device/core/usecases/listAdapterAssignments";

describe("listAdapterAssignments", () => {
    let db: ReturnType<typeof createDeviceTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createDeviceTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    beforeEach(() => {
        db.delete(deviceCursors).run();
        db.delete(devicesTable).run();
    });

    it("returns enabled devices with lastAckedEventId", () => {
        db.insert(devicesTable).values([
            {
                id: "dev-1",
                direction: "IN",
                adapterKey: "dahua",
                settingsJson: "{\"ip\":\"1.1.1.1\"}",
                enabled: 1
            },
            {
                id: "dev-2",
                direction: "OUT",
                adapterKey: "dahua",
                settingsJson: null,
                enabled: 0
            }
        ]).run();

        db.insert(deviceCursors).values({
            deviceId: "dev-1",
            lastAckedEventId: "evt-9",
            lastAckedAt: new Date("2026-01-01T00:00:00.000Z"),
            updatedAt: new Date("2026-01-01T00:00:00.000Z")
        }).run();

        const uc = createListAdapterAssignmentsUC({
            devicesRepo: createDevicesRepo(db),
            deviceCursorsRepo: createDeviceCursorsRepo(db)
        });

        const res = uc("dahua");

        expect(res.devices).toEqual([
            {
                deviceId: "dev-1",
                direction: "IN",
                settingsJson: "{\"ip\":\"1.1.1.1\"}",
                lastAckedEventId: "evt-9"
            }
        ]);
    });
});

