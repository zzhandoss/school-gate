export type AlertSubscription = {
    adminId: string;
    ruleId: string;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type AlertRecipient = {
    adminId: string;
    ruleId: string;
    tgUserId: string;
};
