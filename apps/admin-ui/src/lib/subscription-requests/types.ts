export type SubscriptionRequestResolutionStatus = "new" | "ready_for_review" | "needs_person";
export type SubscriptionRequestStatus = "pending" | "approved" | "rejected";

export type SubscriptionRequestItem = {
    id: string
    tgUserId: string
    iin: string
    status: SubscriptionRequestStatus
    resolutionStatus: SubscriptionRequestResolutionStatus
    personId: string | null
    resolutionMessage: string | null
    resolvedAt: string | null
    createdAt: string
    reviewedAt: string | null
    reviewedBy: string | null
};

export type ListSubscriptionRequestsInput = {
    limit?: number
    offset?: number
    status?: "all" | SubscriptionRequestStatus | "not_pending"
    only?: "all" | SubscriptionRequestResolutionStatus
    order?: "oldest" | "newest"
};

export type ListSubscriptionRequestsResult = {
    requests: Array<SubscriptionRequestItem>
    page: {
        limit: number
        offset: number
        total: number
    }
};

export type ReviewSubscriptionRequestInput = {
    decision: "approve" | "reject"
    adminTgUserId: string
};

export type ReviewSubscriptionRequestResult = {
    requestId: string
    status: "approved" | "rejected"
    personId: string | null
};

export type ResolveSubscriptionRequestPersonInput = {
    personId: string
};

export type ResolveSubscriptionRequestPersonResult = {
    requestId: string
    resolutionStatus: "ready_for_review"
    personId: string
};
