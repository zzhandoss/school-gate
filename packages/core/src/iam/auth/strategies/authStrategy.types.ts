import type { Admin } from "../../entities/admin.js";

export type AuthStrategyId = "email_password" | "telegram_code";

export type EmailPasswordAuthInput = {
    email: string;
    password: string;
};

export type TelegramCodeAuthInput = {
    code: string;
};

export type AuthStrategyInputById = {
    email_password: EmailPasswordAuthInput;
    telegram_code: TelegramCodeAuthInput;
};

export type AuthStrategyResult = {
    admin: Admin;
};

export type AuthStrategy = {
    id: AuthStrategyId;
    authenticate(input: AuthStrategyInputById[AuthStrategyId]): Promise<AuthStrategyResult | null>;
};
