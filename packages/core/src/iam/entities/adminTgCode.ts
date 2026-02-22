export type AdminTgCodePurpose = "link" | "login";

export type AdminTgCode = {
    codeHash: string;
    adminId: string;
    purpose: AdminTgCodePurpose;
    expiresAt: Date;
    usedAt: Date | null;
    createdAt: Date;
};
