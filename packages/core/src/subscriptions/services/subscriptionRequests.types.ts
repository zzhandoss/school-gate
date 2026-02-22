import type { SubscriptionRequest, SubscriptionRequestStatus } from "../entities/subscriptionRequest.js";
import type { SubscriptionRequestsRepo } from "../repos/subscriptionRequests.repo.js";

export type SubscriptionRequestsService = {
    createPending(input: { id: string; tgUserId: string; iin: string }): Promise<void>;
    getById(id: string): Promise<SubscriptionRequest | null>;
    getByIdSync(id: string): SubscriptionRequest | null;
    getPendingByTgUserAndIin(input: { tgUserId: string; iin: string }): Promise<SubscriptionRequest | null>;
    updateStatus(input: { id: string; status: Exclude<SubscriptionRequestStatus, "pending">; reviewedAt: Date; reviewedBy: string }): Promise<void>;
    updateStatusSync(input: { id: string; status: Exclude<SubscriptionRequestStatus, "pending">; reviewedAt: Date; reviewedBy: string }): void;
    listPendingNew(input: { limit: number }): Promise<SubscriptionRequest[]>;
    markReadyForReview(input: { id: string; personId: string; resolvedAt: Date }): Promise<void>;
    markNeedsPerson(input: { id: string; message: string; resolvedAt: Date }): Promise<void>;
    listPendingForAdmin(input: {
        limit: number;
        offset?: number;
        only?: "all" | "ready_for_review" | "needs_person" | "new";
        order?: "oldest" | "newest";
    }): Promise<SubscriptionRequest[]>;
    listForAdmin(input: {
        limit: number;
        offset?: number;
        status?: "all" | SubscriptionRequestStatus | "not_pending";
        only?: "all" | "ready_for_review" | "needs_person" | "new";
        order?: "oldest" | "newest";
    }): Promise<{
        requests: SubscriptionRequest[];
        total: number;
    }>;
    listByTgUserId(input: {
        tgUserId: string;
        limit: number;
        offset?: number;
        order?: "oldest" | "newest";
    }): Promise<SubscriptionRequest[]>;
    withTx(tx: unknown): SubscriptionRequestsService;
};

export type SubscriptionRequestsServiceDeps = {
    subscriptionRequestsRepo: SubscriptionRequestsRepo;
};

