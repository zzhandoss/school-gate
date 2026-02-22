import { and, eq } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { personTerminalIdentities } from "@school-gate/db/schema";
import type { PersonTerminalIdentitiesRepo, PersonTerminalIdentity } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function mapIdentity(row: typeof personTerminalIdentities.$inferSelect): PersonTerminalIdentity {
    return {
        id: row.id,
        personId: row.personId,
        deviceId: row.deviceId,
        terminalPersonId: row.terminalPersonId,
        createdAt: toDate(row.createdAt),
    } satisfies PersonTerminalIdentity;
}

export function createPersonTerminalIdentitiesRepo(db: Db): PersonTerminalIdentitiesRepo {
    return {
        async upsert({ id, personId, deviceId, terminalPersonId }) {
            await db
                .insert(personTerminalIdentities)
                .values({ id, personId, deviceId, terminalPersonId })
                .onConflictDoUpdate({
                    target: [personTerminalIdentities.personId, personTerminalIdentities.deviceId],
                    set: { terminalPersonId },
                });
        },

        async create({ id, personId, deviceId, terminalPersonId }) {
            await db.insert(personTerminalIdentities).values({ id, personId, deviceId, terminalPersonId });
        },

        async getById({ id }) {
            const rows = await db.select().from(personTerminalIdentities).where(eq(personTerminalIdentities.id, id)).limit(1);
            const row = rows[0];
            if (!row) return null;
            return mapIdentity(row);
        },

        async getByDeviceAndTerminalPersonId({ deviceId, terminalPersonId }) {
            const rows = await db
                .select()
                .from(personTerminalIdentities)
                .where(and(eq(personTerminalIdentities.deviceId, deviceId), eq(personTerminalIdentities.terminalPersonId, terminalPersonId)))
                .limit(1);
            const row = rows[0];
            if (!row) return null;
            return mapIdentity(row);
        },

        async getByPersonAndDevice({ personId, deviceId }) {
            const rows = await db
                .select()
                .from(personTerminalIdentities)
                .where(and(eq(personTerminalIdentities.personId, personId), eq(personTerminalIdentities.deviceId, deviceId)))
                .limit(1);
            const row = rows[0];
            if (!row) return null;
            return mapIdentity(row);
        },

        async updateById({ id, deviceId, terminalPersonId }) {
            await db
                .update(personTerminalIdentities)
                .set({ deviceId, terminalPersonId })
                .where(eq(personTerminalIdentities.id, id));
        },

        async deleteById({ id }) {
            await db.delete(personTerminalIdentities).where(eq(personTerminalIdentities.id, id));
        },

        async listByPersonId({ personId }) {
            const rows = await db
                .select()
                .from(personTerminalIdentities)
                .where(eq(personTerminalIdentities.personId, personId));
            return rows.map(mapIdentity);
        },

        withTx(tx) {
            return createPersonTerminalIdentitiesRepo(tx as Db);
        },
    };
}
