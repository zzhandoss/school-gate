import type { PersonTerminalIdentity } from "../entities/personTerminalIdentity.js";
import type { PersonTerminalIdentitiesRepo } from "../repos/personTerminalIdentities.repo.js";

export type PersonTerminalIdentitiesService = {
    upsert(input: { id: string; personId: string; deviceId: string; terminalPersonId: string }): Promise<void>;
    create(input: { id: string; personId: string; deviceId: string; terminalPersonId: string }): Promise<void>;
    getById(input: { id: string }): Promise<PersonTerminalIdentity | null>;
    getByDeviceAndTerminalPersonId(input: {
        deviceId: string;
        terminalPersonId: string;
    }): Promise<PersonTerminalIdentity | null>;
    getByPersonAndDevice(input: { personId: string; deviceId: string }): Promise<PersonTerminalIdentity | null>;
    updateById(input: { id: string; deviceId: string; terminalPersonId: string }): Promise<void>;
    deleteById(input: { id: string }): Promise<void>;
    listByPersonId(input: { personId: string }): Promise<PersonTerminalIdentity[]>;
    withTx(tx: unknown): PersonTerminalIdentitiesService;
};

export type PersonTerminalIdentitiesServiceDeps = {
    personTerminalIdentitiesRepo: PersonTerminalIdentitiesRepo;
};

