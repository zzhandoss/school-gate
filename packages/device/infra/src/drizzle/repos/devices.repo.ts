import { eq } from "drizzle-orm";
import { devices } from "@school-gate/device/device-db/schema/devices";
import type { DeviceDb } from "@school-gate/device/device-db/drizzle";
import type { DevicesRepo, Device } from "@school-gate/device/core/repos/devices.repo";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

export function createDevicesRepo(db: DeviceDb): DevicesRepo {
    const upsert: DevicesRepo["upsert"] = (input) => {
            db
                .insert(devices)
                .values({
                    id: input.id,
                    name: input.name ?? null,
                    direction: input.direction,
                    adapterKey: input.adapterKey,
                    settingsJson: input.settingsJson ?? null,
                    enabled: input.enabled,
                    createdAt: input.createdAt,
                    updatedAt: input.updatedAt,
                })
                .onConflictDoUpdate({
                    target: devices.id,
                    set: {
                        name: input.name ?? null,
                        direction: input.direction,
                        adapterKey: input.adapterKey,
                        settingsJson: input.settingsJson ?? null,
                        enabled: input.enabled,
                        updatedAt: input.updatedAt,
                    },
                })
                .run();
    };

    const getById: DevicesRepo["getById"] = (id) => {
            const rows = db.select().from(devices).where(eq(devices.id, id)).limit(1).all();
            const r = rows[0];
            if (!r) return null;

            return {
                id: r.id,
                name: r.name ?? null,
                direction: r.direction,
                adapterKey: r.adapterKey,
                settingsJson: r.settingsJson ?? null,
                enabled: r.enabled,
                createdAt: toDate(r.createdAt),
                updatedAt: toDate(r.updatedAt),
            } satisfies Device;
    };

    const list: DevicesRepo["list"] = () => {
            const rows = db.select().from(devices).all();
            return rows.map((r) => ({
                id: r.id,
                name: r.name ?? null,
                direction: r.direction,
                adapterKey: r.adapterKey,
                settingsJson: r.settingsJson ?? null,
                enabled: r.enabled,
                createdAt: toDate(r.createdAt),
                updatedAt: toDate(r.updatedAt),
            })) satisfies Device[];
    };

    const listByAdapterKey: DevicesRepo["listByAdapterKey"] = (adapterKey) => {
            const rows = db.select().from(devices).where(eq(devices.adapterKey, adapterKey)).all();
            return rows.map((r) => ({
                id: r.id,
                name: r.name ?? null,
                direction: r.direction,
                adapterKey: r.adapterKey,
                settingsJson: r.settingsJson ?? null,
                enabled: r.enabled,
                createdAt: toDate(r.createdAt),
                updatedAt: toDate(r.updatedAt),
            })) satisfies Device[];
    };

    const setEnabled: DevicesRepo["setEnabled"] = ({ id, enabled, updatedAt }) => {
            const res = db
                .update(devices)
                .set({ enabled, updatedAt })
                .where(eq(devices.id, id))
                .run();
            return res.changes > 0;
    };

    const deleteDevice: DevicesRepo["delete"] = (id) => {
            const res = db.delete(devices).where(eq(devices.id, id)).run();
            return res.changes > 0;
    };

    return {
        upsert,
        getById,
        list,
        listByAdapterKey,
        setEnabled,
        delete: deleteDevice,
    };
}
