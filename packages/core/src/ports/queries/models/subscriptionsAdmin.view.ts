export type SubscriptionAdminView = {
    id: string;
    tgUserId: string;
    personId: string;
    isActive: boolean;
    createdAt: Date;
    person: {
        id: string;
        iin: string;
        firstName: string | null;
        lastName: string | null;
    };
    parent: {
        tgUserId: string;
        chatId: string;
    };
};
