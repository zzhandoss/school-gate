export type ParentSubscriptionView = {
    id: string;
    isActive: boolean;
    person: {
        iin: string;
        firstName: string | null;
        lastName: string | null;
    };
};

export type ParentSubscriptionRequestView = {
    id: string;
    iin: string;
    status: "pending" | "approved" | "rejected";
    resolutionStatus: "new" | "ready_for_review" | "needs_person";
    resolutionMessage: string | null;
    createdAt: string;
};

export type ParentDashboardView = {
    subscriptions: ParentSubscriptionView[];
    requests: ParentSubscriptionRequestView[];
};

export type ParentBotService = {
    requestSubscription(input: { tgUserId: string; chatId: string; iin: string }): Promise<{ requestId: string }>;
    getDashboard(input: { tgUserId: string }): Promise<ParentDashboardView>;
    setSubscriptionStatus(input: {
        tgUserId: string;
        subscriptionId: string;
        isActive: boolean;
    }): Promise<{ subscriptionId: string; isActive: boolean }>;
};
