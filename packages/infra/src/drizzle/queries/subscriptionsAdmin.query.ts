import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { parents, persons, subscriptions } from "@school-gate/db/schema";
import {
    SubscriptionAdminView,
    SubscriptionsAdminQueryPort,
} from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

export function createSubscriptionsAdminQuery(db: Db): SubscriptionsAdminQueryPort {
    return {
        async list({ limit, offset, personId, tgUserId, onlyActive }) {
            const conditions: SQL[] = [];
            if (personId) conditions.push(eq(subscriptions.personId, personId));
            if (tgUserId) conditions.push(eq(subscriptions.tgUserId, tgUserId));
            if (onlyActive === true) conditions.push(eq(subscriptions.isActive, true));

            const query = db
                .select({
                    id: subscriptions.id,
                    tgUserId: subscriptions.tgUserId,
                    personId: subscriptions.personId,
                    isActive: subscriptions.isActive,
                    createdAt: subscriptions.createdAt,
                    person: {
                        id: persons.id,
                        iin: persons.iin,
                        firstName: persons.firstName,
                        lastName: persons.lastName,
                    },
                    parent: {
                        tgUserId: parents.tgUserId,
                        chatId: parents.chatId,
                    },
                })
                .from(subscriptions)
                .innerJoin(persons, eq(subscriptions.personId, persons.id))
                .innerJoin(parents, eq(subscriptions.tgUserId, parents.tgUserId))
                .orderBy(desc(subscriptions.createdAt))
                .limit(limit)
                .offset(offset);

            const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

            return rows.map((row) => ({
                id: row.id,
                tgUserId: row.tgUserId,
                personId: row.personId,
                isActive: Boolean(row.isActive),
                createdAt: toDate(row.createdAt),
                person: {
                    id: row.person.id,
                    iin: row.person.iin,
                    firstName: row.person.firstName ?? null,
                    lastName: row.person.lastName ?? null,
                },
                parent: {
                    tgUserId: row.parent.tgUserId,
                    chatId: row.parent.chatId,
                },
            })) satisfies SubscriptionAdminView[];
        },
    };
}
