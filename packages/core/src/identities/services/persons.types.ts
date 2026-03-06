import type { Person } from "../entities/person.js";
import type { PersonsRepo } from "../repos/persons.repo.js";

export type SearchPersonsByIinInput = {
    iin: string;
    limit: number;
};

export type ListPersonsInput = {
    limit: number;
    offset: number;
    iin?: string;
    query?: string;
    linkedStatus?: "all" | "linked" | "unlinked";
    includeDeviceIds?: string[];
    excludeDeviceIds?: string[];
};

export type PersonsService = {
    create(input: {
        id: string;
        iin: string;
        terminalPersonId?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    }): Promise<void>;
    getById(id: string): Promise<Person | null>;
    getByIin(iin: string): Promise<Person | null>;
    list(input: ListPersonsInput): Promise<Person[]>;
    count(input: {
        iin?: string;
        query?: string;
        linkedStatus?: "all" | "linked" | "unlinked";
        includeDeviceIds?: string[];
        excludeDeviceIds?: string[];
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
    searchByIin(input: SearchPersonsByIinInput): Promise<Person[]>;
    withTx(tx: unknown): PersonsService;
};

export type PersonsServiceDeps = {
    personsRepo: PersonsRepo;
};

