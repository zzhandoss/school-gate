import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDeviceTestDb } from "../helpers/deviceTestDb.js";
import { devices } from "@school-gate/device/device-db/schema/index";
import { createDevicesRepo } from "@school-gate/device/infra/drizzle/repos/devices.repo";
import { createRegisterDeviceUC } from "@school-gate/device/core/usecases/registerDevice";

describe("registerDevice", () => {
    let db: ReturnType<typeof createDeviceTestDb>["db"];
    let cleanup: () => void;

    beforeAll(() => {
        const tdb = createDeviceTestDb();
        db = tdb.db;
        cleanup = tdb.cleanup;
    });

    afterAll(() => cleanup());

    it("upserts device with settings and enabled flag", () => {
        const repo = createDevicesRepo(db);
        const clock = { now: () => new Date("2020-01-01T00:00:00.000Z") };
        const uc = createRegisterDeviceUC({ devicesRepo: repo, clock });

        uc({
            id: "dev-1",
            name: "Gate 1",
            direction: "IN",
            adapterKey: "dahua",
            settingsJson: "{\"host\":\"10.0.0.1\"}",
            enabled: true
        });

        const rows = db.select().from(devices).all();
        expect(rows).toHaveLength(1);
        expect(rows[0]!.id).toBe("dev-1");
        expect(rows[0]!.name).toBe("Gate 1");
        expect(rows[0]!.direction).toBe("IN");
        expect(rows[0]!.adapterKey).toBe("dahua");
        expect(rows[0]!.enabled).toBe(true);
    });

    it("updates existing device on second register", () => {
        const repo = createDevicesRepo(db);
        const uc1 = createRegisterDeviceUC({
            devicesRepo: repo,
            clock: { now: () => new Date("2020-01-01T00:00:00.000Z") }
        });
        const uc2 = createRegisterDeviceUC({
            devicesRepo: repo,
            clock: { now: () => new Date("2020-01-02T00:00:00.000Z") }
        });

        uc1({
            id: "dev-2",
            name: "Gate 2",
            direction: "OUT",
            adapterKey: "dahua",
            enabled: true
        });

        uc2({
            id: "dev-2",
            name: "Gate 2 V2",
            direction: "OUT",
            adapterKey: "dahua-v2",
            enabled: false
        });

        const rows = db.select().from(devices).where(eq(devices.id, "dev-2")).all();
        expect(rows).toHaveLength(1);
        expect(rows[0]!.adapterKey).toBe("dahua-v2");
        expect(rows[0]!.enabled).toBe(false);
    });
});

