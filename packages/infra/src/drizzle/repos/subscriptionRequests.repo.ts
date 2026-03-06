import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { Db } from "@school-gate/db/drizzle";
import { subscriptionRequests } from "@school-gate/db/schema";
import type {
    SubscriptionRequestsRepo,
    SubscriptionRequest
} from "@school-gate/core";

function toDate(v: unknown): Date {
    return v instanceof Date ? v : new Date(String(v));
}

function isUniqueConstraintError(e: any): boolean {
    const msg = String(e?.message ?? "").toLowerCase();
    return msg.includes("unique") || msg.includes("constraint");
}

function mapRow(r: any): SubscriptionRequest {
    return {
        id: r.id,
        tgUserId: r.tgUserId,
        iin: r.iin,
        status: r.status,

        resolutionStatus: r.resolutionStatus,
        personId: r.personId ?? null,
        resolutionMessage: r.resolutionMessage ?? null,
        resolvedAt: r.resolvedAt ? toDate(r.resolvedAt) : null,

        createdAt: toDate(r.createdAt),
        reviewedAt: r.reviewedAt ? toDate(r.reviewedAt) : null,
        reviewedBy: r.reviewedBy ?? null
    };
}

export function createSubscriptionRequestsRepo(db: Db): SubscriptionRequestsRepo {
    function buildAdminFilter(input: {
        status?: "all" | "pending" | "approved" | "rejected" | "not_pending";
        only?: "all" | "ready_for_review" | "needs_person" | "new";
    }) {
        const status = input.status ?? "pending";
        const only = input.only ?? "all";
        const statusFilter =
            status === "all"
                ? undefined
                : status === "not_pending"
                    ? ne(subscriptionRequests.status, "pending")
                    : eq(subscriptionRequests.status, status);

        const shouldApplyResolutionFilter =
            (status === "all" || status === "pending") &&
            only !== "all";

        const resolutionFilter = shouldApplyResolutionFilter
            ? eq(subscriptionRequests.resolutionStatus, only)
            : undefined;

        const filters = [statusFilter, resolutionFilter].filter((value) => value !== undefined);
        return filters.length > 0 ? and(...filters) : undefined;
    }

    return {
        async createPending({ id, tgUserId, iin }) {
            try {
                await db.insert(subscriptionRequests).values({
                    id,
                    tgUserId,
                    iin,
                    status: "pending",
                    resolutionStatus: "new"
                });
            } catch (e: any) {
                if (isUniqueConstraintError(e)) {
                    throw new Error("SUBSCRIPTION_REQUEST_PENDING_ALREADY_EXISTS");
                }
                throw e;
            }
        },

        async getById(id) {
            const rows = await db
                .select()
                .from(subscriptionRequests)
                .where(eq(subscriptionRequests.id, id))
                .limit(1);

            return rows[0] ? mapRow(rows[0]) : null;
        },

        getByIdSync(id) {
            const rows = db
                .select()
                .from(subscriptionRequests)
                .where(eq(subscriptionRequests.id, id))
                .limit(1)
                .all();

            return rows[0] ? mapRow(rows[0]) : null;
        },

        async getPendingByTgUserAndIin({ tgUserId, iin }) {
            const rows = await db
                .select()
                .from(subscriptionRequests)
                .where(
                    and(
                        eq(subscriptionRequests.tgUserId, tgUserId),
                        eq(subscriptionRequests.iin, iin),
                        eq(subscriptionRequests.status, "pending")
                    )
                )
                .limit(1);

            return rows[0] ? mapRow(rows[0]) : null;
        },

        async updateStatus({ id, status, reviewedAt, reviewedBy }) {
            await db
                .update(subscriptionRequests)
                .set({ status, reviewedAt, reviewedBy })
                .where(eq(subscriptionRequests.id, id));
        },

        updateStatusSync({ id, status, reviewedAt, reviewedBy }) {
            db
                .update(subscriptionRequests)
                .set({ status, reviewedAt, reviewedBy })
                .where(eq(subscriptionRequests.id, id))
                .run();
        },

        async listPendingNew({ limit }) {
            const rows = await db
                .select()
                .from(subscriptionRequests)
                .where(
                    and(
                        eq(subscriptionRequests.status, "pending"),
                        eq(subscriptionRequests.resolutionStatus, "new")
                    )
                )
                .limit(limit);

            return rows.map(mapRow);
        },

        async markReadyForReview({ id, personId, resolvedAt }) {
            await db
                .update(subscriptionRequests)
                .set({
                    resolutionStatus: "ready_for_review",
                    personId,
                    resolvedAt,
                    resolutionMessage: null
                })
                .where(eq(subscriptionRequests.id, id));
        },

        async markNeedsPerson({ id, message, resolvedAt }) {
            await db
                .update(subscriptionRequests)
                .set({
                    resolutionStatus: "needs_person",
                    personId: null,
                    resolvedAt,
                    resolutionMessage: message
                })
                .where(eq(subscriptionRequests.id, id));
        },
        async listPendingForAdmin({ limit, offset = 0, only = "all", order = "oldest" }) {
            const timeOrder =
                order === "newest"
                    ? desc(subscriptionRequests.createdAt)
                    : asc(subscriptionRequests.createdAt);

            const rows = await db
                .select()
                .from(subscriptionRequests)
                .where(buildAdminFilter({ status: "pending", only }))
                .orderBy(timeOrder)
                .limit(limit)
                .offset(offset);

            return rows.map(mapRow);
        },
        async listForAdmin({ limit, offset = 0, status = "pending", only = "all", order = "oldest" }) {
            const where = buildAdminFilter({ status, only });
            const timeOrder =
                order === "newest"
                    ? desc(subscriptionRequests.createdAt)
                    : asc(subscriptionRequests.createdAt);

            const [rows, totalRows] = await Promise.all([
                db
                    .select()
                    .from(subscriptionRequests)
                    .where(where)
                    .orderBy(timeOrder)
                    .limit(limit)
                    .offset(offset),
                db
                    .select({ count: sql<number>`count(*)` })
                    .from(subscriptionRequests)
                    .where(where)
            ]);

            return { requests: rows.map(mapRow), total: Number(totalRows[0]?.count ?? 0) };
        },
        async listByTgUserId({ tgUserId, limit, offset = 0, order = "newest" }) {
            const timeOrder =
                order === "newest"
                    ? desc(subscriptionRequests.createdAt)
                    : asc(subscriptionRequests.createdAt);

            const rows = await db
                .select()
                .from(subscriptionRequests)
                .where(eq(subscriptionRequests.tgUserId, tgUserId))
                .orderBy(timeOrder)
                .limit(limit)
                .offset(offset);

            return rows.map(mapRow);
        },

        unlinkPersonByPersonIdSync({ personId, message, resolvedAt }) {
            const rows = db
                .select({
                    id: subscriptionRequests.id,
                    status: subscriptionRequests.status,
                    resolutionStatus: subscriptionRequests.resolutionStatus
                })
                .from(subscriptionRequests)
                .where(eq(subscriptionRequests.personId, personId))
                .all();

            if (rows.length === 0) {
                return { updated: 0, resetToNeedsPerson: 0 };
            }

            db
                .update(subscriptionRequests)
                .set({ personId: null })
                .where(eq(subscriptionRequests.personId, personId))
                .run();

            const resetRows = rows.filter(
                (row) => row.status === "pending" && row.resolutionStatus === "ready_for_review"
            );

            if (resetRows.length > 0) {
                db
                    .update(subscriptionRequests)
                    .set({
                        resolutionStatus: "needs_person",
                        resolutionMessage: message,
                        resolvedAt
                    })
                    .where(inArray(subscriptionRequests.id, resetRows.map((row) => row.id)))
                    .run();
            }

            return {
                updated: rows.length,
                resetToNeedsPerson: resetRows.length
            };
        },

        withTx(tx) {
            return createSubscriptionRequestsRepo(tx as Db);
        }

    };
}

