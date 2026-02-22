import type { Parent } from "../entities/parent.js";
import type { ParentsRepo } from "../repos/parents.repo.js";

export type ParentsService = {
    upsert(input: { tgUserId: string; chatId: string }): Promise<void>;
    getByTgUserId(tgUserId: string): Promise<Parent | null>;
    withTx(tx: unknown): ParentsService;
};

export type ParentsServiceDeps = {
    parentsRepo: ParentsRepo;
};

