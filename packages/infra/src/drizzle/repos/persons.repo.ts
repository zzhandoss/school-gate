import { and, asc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { personTerminalIdentities, persons } from "@school-gate/db/schema";
import type { Person, PersonsRepo } from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function isUniqueConstraintError(e: unknown): boolean {
    const msg = String((e as { message?: string })?.message ?? "").toLowerCase();
    return msg.includes("unique") || msg.includes("constraint");
}

function mapPerson(row: typeof persons.$inferSelect): Person {
    return {
        id: row.id,
        iin: row.iin,
        terminalPersonId: row.terminalPersonId ?? null,
        firstName: row.firstName ?? null,
        lastName: row.lastName ?? null,
        createdAt: toDate(row.createdAt)
    } satisfies Person;
}

function buildWhereClause(input: {
    iin?: string;
    query?: string;
    linkedStatus?: "all" | "linked" | "unlinked";
    includeDeviceIds?: string[];
    excludeDeviceIds?: string[];
}) {
    const normalizedIin = input.iin?.trim();
    const normalizedQuery = input.query?.trim().toLowerCase();
    const normalizedIncludeDeviceIds = Array.from(
        new Set((input.includeDeviceIds ?? []).map((value) => value.trim()).filter((value) => value.length > 0))
    );
    const normalizedExcludeDeviceIds = Array.from(
        new Set((input.excludeDeviceIds ?? []).map((value) => value.trim()).filter((value) => value.length > 0))
    );

    const filters: SQL[] = [];
    if (normalizedIin) {
        filters.push(like(persons.iin, `${normalizedIin}%`));
    }
    if (normalizedQuery) {
        const queryFilter = or(
            like(persons.iin, `%${normalizedQuery}%`),
            like(persons.firstName, `%${normalizedQuery}%`),
            like(persons.lastName, `%${normalizedQuery}%`)
        );
        if (queryFilter !== undefined) {
            filters.push(queryFilter);
        }
    }
    if (input.linkedStatus === "linked") {
        filters.push(
            sql`exists (
                select 1
                from ${personTerminalIdentities}
                where ${personTerminalIdentities.personId} = ${persons.id}
            )`
        );
    }
    if (input.linkedStatus === "unlinked") {
        filters.push(
            sql`not exists (
                select 1
                from ${personTerminalIdentities}
                where ${personTerminalIdentities.personId} = ${persons.id}
            )`
        );
    }
    if (normalizedIncludeDeviceIds.length > 0) {
        filters.push(
            sql`exists (
                select 1
                from ${personTerminalIdentities}
                where ${personTerminalIdentities.personId} = ${persons.id}
                  and ${inArray(personTerminalIdentities.deviceId, normalizedIncludeDeviceIds)}
            )`
        );
    }
    if (normalizedExcludeDeviceIds.length > 0) {
        filters.push(
            sql`not exists (
                select 1
                from ${personTerminalIdentities}
                where ${personTerminalIdentities.personId} = ${persons.id}
                  and ${inArray(personTerminalIdentities.deviceId, normalizedExcludeDeviceIds)}
            )`
        );
    }

    if (filters.length === 0) {
        return undefined;
    }
    if (filters.length === 1) {
        return filters[0];
    }
    return and(...filters);
}

export function createPersonsRepo(db: Db): PersonsRepo {
    return {
        async create(input) {
            try {
                await db.insert(persons).values({
                    id: input.id,
                    iin: input.iin,
                    terminalPersonId: input.terminalPersonId ?? null,
                    firstName: input.firstName ?? null,
                    lastName: input.lastName ?? null
                });
            } catch (e: unknown) {
                if (isUniqueConstraintError(e)) {
                    throw new Error("PERSON_UNIQUE_CONSTRAINT");
                }
                throw e;
            }
        },

        async getById(id) {
            const rows = await db.select().from(persons).where(eq(persons.id, id)).limit(1);
            const row = rows[0];
            if (!row) return null;
            return mapPerson(row);
        },

        async getByIin(iin) {
            const rows = await db.select().from(persons).where(eq(persons.iin, iin)).limit(1);
            const row = rows[0];
            if (!row) return null;
            return mapPerson(row);
        },

        async list({ limit, offset, iin, query, linkedStatus, includeDeviceIds, excludeDeviceIds }) {
            const whereClause = buildWhereClause({
                ...(iin !== undefined ? { iin } : {}),
                ...(query !== undefined ? { query } : {}),
                ...(linkedStatus !== undefined ? { linkedStatus } : {}),
                ...(includeDeviceIds !== undefined ? { includeDeviceIds } : {}),
                ...(excludeDeviceIds !== undefined ? { excludeDeviceIds } : {})
            });

            const baseQuery = db
                .select()
                .from(persons);

            const rows = await (whereClause === undefined ? baseQuery : baseQuery.where(whereClause))
                .orderBy(asc(persons.createdAt), asc(persons.iin))
                .limit(limit)
                .offset(offset);

            return rows.map(mapPerson);
        },

        async count({ iin, query, linkedStatus, includeDeviceIds, excludeDeviceIds }) {
            const whereClause = buildWhereClause({
                ...(iin !== undefined ? { iin } : {}),
                ...(query !== undefined ? { query } : {}),
                ...(linkedStatus !== undefined ? { linkedStatus } : {}),
                ...(includeDeviceIds !== undefined ? { includeDeviceIds } : {}),
                ...(excludeDeviceIds !== undefined ? { excludeDeviceIds } : {})
            });
            const baseQuery = db
                .select({ count: sql<number>`count(*)` })
                .from(persons);
            const rows = await (whereClause === undefined ? baseQuery : baseQuery.where(whereClause));

            return Number(rows[0]?.count ?? 0);
        },

        async searchByIinPrefix({ iinPrefix, limit }) {
            const rows = await db
                .select()
                .from(persons)
                .where(like(persons.iin, `${iinPrefix}%`))
                .orderBy(asc(persons.iin))
                .limit(limit);
            return rows.map(mapPerson);
        },

        async getByTerminalPersonId(terminalPersonId) {
            const rows = await db
                .select()
                .from(persons)
                .where(eq(persons.terminalPersonId, terminalPersonId))
                .limit(1);
            const row = rows[0];
            if (!row) return null;
            return mapPerson(row);
        },

        async updateById({ id, iin, terminalPersonId, firstName, lastName }) {
            const patch: Record<string, unknown> = {};
            if (iin !== undefined) patch.iin = iin;
            if (terminalPersonId !== undefined) patch.terminalPersonId = terminalPersonId;
            if (firstName !== undefined) patch.firstName = firstName;
            if (lastName !== undefined) patch.lastName = lastName;
            if (Object.keys(patch).length === 0) return;

            try {
                await db.update(persons).set(patch).where(eq(persons.id, id));
            } catch (e: unknown) {
                if (isUniqueConstraintError(e)) {
                    throw new Error("PERSON_UNIQUE_CONSTRAINT");
                }
                throw e;
            }
        },

        deleteByIdSync({ id }) {
            const rows = db.select({ id: persons.id }).from(persons).where(eq(persons.id, id)).limit(1).all();
            if (!rows[0]) {
                return false;
            }

            db.delete(persons).where(eq(persons.id, id)).run();
            return true;
        },

        withTx(tx) {
            return createPersonsRepo(tx as Db);
        }
    };
}
