import { and, asc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import type {
    ListPersonsAdminInput,
    PersonAdminView,
    PersonsAdminQueryPort
} from "@school-gate/core";
import type { Db } from "@school-gate/db/drizzle";
import { personTerminalIdentities, persons } from "@school-gate/db/schema";

function toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
}

function buildPersonsAdminWhere(input: Omit<ListPersonsAdminInput, "limit" | "offset">) {
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
        if (queryFilter) {
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

export function createPersonsAdminQuery(db: Db): PersonsAdminQueryPort {
    return {
        async list(input) {
            const where = buildPersonsAdminWhere(input);
            const personIdentityCounts = db
                .select({
                    personId: personTerminalIdentities.personId,
                    linkCount: sql<number>`count(*)`.as("linkCount")
                })
                .from(personTerminalIdentities)
                .groupBy(personTerminalIdentities.personId)
                .as("person_identity_counts");
            const hasDeviceIdentitiesExpr = sql<number>`case
                when ${personIdentityCounts.linkCount} is not null then 1
                else 0
            end`;

            const baseRowsQuery = db
                .select({
                    id: persons.id,
                    iin: persons.iin,
                    terminalPersonId: persons.terminalPersonId,
                    firstName: persons.firstName,
                    lastName: persons.lastName,
                    createdAt: persons.createdAt,
                    hasDeviceIdentities: hasDeviceIdentitiesExpr
                })
                .from(persons)
                .leftJoin(personIdentityCounts, eq(personIdentityCounts.personId, persons.id));
            const rows = await (where ? baseRowsQuery.where(where) : baseRowsQuery)
                .orderBy(asc(persons.createdAt), asc(persons.iin))
                .limit(input.limit)
                .offset(input.offset);

            const baseCountQuery = db
                .select({ count: sql<number>`count(*)` })
                .from(persons);
            const totalRows = await (where ? baseCountQuery.where(where) : baseCountQuery);

            return {
                persons: rows.map(
                    (row) =>
                        ({
                            id: row.id,
                            iin: row.iin,
                            terminalPersonId: row.terminalPersonId ?? null,
                            hasDeviceIdentities: Number(row.hasDeviceIdentities ?? 0) > 0,
                            firstName: row.firstName ?? null,
                            lastName: row.lastName ?? null,
                            createdAt: toDate(row.createdAt)
                        }) satisfies PersonAdminView
                ),
                total: Number(totalRows[0]?.count ?? 0)
            };
        }
    };
}
