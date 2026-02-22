export type SubscriptionRequestStatus = "pending" | "approved" | "rejected";
export type SubscriptionRequestResolutionStatus = "new" | "ready_for_review" | "needs_person";

export type SubscriptionRequest = {
    id: string;
    tgUserId: string;
    iin: string;
    status: SubscriptionRequestStatus;
    resolutionStatus: SubscriptionRequestResolutionStatus;
    personId: string | null;
    resolutionMessage: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    reviewedAt: Date | null;
    reviewedBy: string | null;
};
