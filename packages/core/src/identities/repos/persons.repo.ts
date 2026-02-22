import type { Person } from "../entities/person.js";

export interface PersonsRepo {
    create(input: {
        id: string;
        iin: string;
        terminalPersonId?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    }): Promise<void>;

    getById(id: string): Promise<Person | null>;
    getByIin(iin: string): Promise<Person | null>;
    list(input: {
        limit: number;
        offset: number;
        iin?: string;
        query?: string;
    }): Promise<Person[]>;
    count(input: {
        iin?: string;
        query?: string;
    }): Promise<number>;
    searchByIinPrefix(input: { iinPrefix: string; limit: number }): Promise<Person[]>;

    getByTerminalPersonId(terminalPersonId: string): Promise<Person | null>;

    updateById(input: {
        id: string;
        iin?: string;
        terminalPersonId?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    }): Promise<void>;
    withTx(tx: unknown): PersonsRepo;
}

