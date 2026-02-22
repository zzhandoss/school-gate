import type { Parent } from "../entities/parent.js";

export interface ParentsRepo {
    upsert(input: { tgUserId: string; chatId: string }): Promise<void>;
    getByTgUserId(tgUserId: string): Promise<Parent | null>;
    withTx(tx: unknown): ParentsRepo;
}

