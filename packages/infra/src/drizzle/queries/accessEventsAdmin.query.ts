import { and, desc, eq, gte, like, lte, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { accessEvents, personTerminalIdentities, persons } from "@school-gate/db/schema";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

export function createAccessEventsAdminQuery(db: Db) {
    return {
        async list(input: {
            limit: number;
            offset: number;
            status?: "NEW" | "PROCESSING" | "PROCESSED" | "FAILED_RETRY" | "UNMATCHED" | "ERROR" | undefined;
            direction?: "IN" | "OUT" | undefined;
            deviceId?: string | undefined;
            iin?: string | undefined;
            terminalPersonId?: string | undefined;
            from?: Date | undefined;
            to?: Date | undefined;
        }) {
            const iinExpr = sql<string | null>`coalesce(${accessEvents.iin}, ${persons.iin})`;
            const conditions: SQL[] = [];

            if (input.status) conditions.push(eq(accessEvents.status, input.status));
            if (input.direction) conditions.push(eq(accessEvents.direction, input.direction));
            if (input.deviceId) conditions.push(eq(accessEvents.deviceId, input.deviceId));
            if (input.iin) conditions.push(like(iinExpr, `%${input.iin}%`));
            if (input.terminalPersonId) {
                conditions.push(like(accessEvents.terminalPersonId, `%${input.terminalPersonId}%`));
            }
            if (input.from) conditions.push(gte(accessEvents.occurredAt, input.from));
            if (input.to) conditions.push(lte(accessEvents.occurredAt, input.to));

            const where = conditions.length > 0 ? and(...conditions) : undefined;

            const rows = await db
                .select({
                    id: accessEvents.id,
                    deviceId: accessEvents.deviceId,
                    direction: accessEvents.direction,
                    occurredAt: accessEvents.occurredAt,
                    terminalPersonId: accessEvents.terminalPersonId,
                    iin: iinExpr,
                    status: accessEvents.status,
                    attempts: accessEvents.attempts,
                    lastError: accessEvents.lastError,
                    processedAt: accessEvents.processedAt,
                    createdAt: accessEvents.createdAt,
                    personId: persons.id,
                    personIin: persons.iin,
                    personFirstName: persons.firstName,
                    personLastName: persons.lastName
                })
                .from(accessEvents)
                .leftJoin(
                    personTerminalIdentities,
                    and(
                        eq(personTerminalIdentities.deviceId, accessEvents.deviceId),
                        eq(personTerminalIdentities.terminalPersonId, accessEvents.terminalPersonId)
                    )
                )
                .leftJoin(persons, eq(persons.id, personTerminalIdentities.personId))
                .where(where)
                .orderBy(desc(accessEvents.occurredAt), desc(accessEvents.createdAt))
                .limit(input.limit)
                .offset(input.offset);

            const totalRows = await db
                .select({ count: sql<number>`count(*)` })
                .from(accessEvents)
                .leftJoin(
                    personTerminalIdentities,
                    and(
                        eq(personTerminalIdentities.deviceId, accessEvents.deviceId),
                        eq(personTerminalIdentities.terminalPersonId, accessEvents.terminalPersonId)
                    )
                )
                .leftJoin(persons, eq(persons.id, personTerminalIdentities.personId))
                .where(where);

            return {
                events: rows.map((row) => ({
                    id: row.id,
                    deviceId: row.deviceId,
                    direction: row.direction,
                    occurredAt: toDate(row.occurredAt),
                    terminalPersonId: row.terminalPersonId ?? null,
                    iin: row.iin ?? null,
                    status: row.status,
                    attempts: row.attempts,
                    lastError: row.lastError ?? null,
                    processedAt: row.processedAt ? toDate(row.processedAt) : null,
                    createdAt: toDate(row.createdAt),
                    person: row.personId && row.personIin ? {
                        id: row.personId,
                        iin: row.personIin,
                        firstName: row.personFirstName ?? null,
                        lastName: row.personLastName ?? null
                    } : null
                })),
                total: Number(totalRows[0]?.count ?? 0)
            };
        }
    };
}
