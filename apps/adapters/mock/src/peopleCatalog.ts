import fs from "node:fs";

export type TerminalPerson = {
    code: string;
    terminalPersonId: string | null;
    fullName: string;
    random?: boolean;
};

export type PeopleCatalog = {
    pickRandomPeople: (count: number) => TerminalPerson[];
    resolveTerminalPersonId: (person: TerminalPerson) => string;
};

function isTerminalPerson(value: unknown): value is TerminalPerson {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    if (typeof row.code !== "string" || row.code.length === 0) return false;
    if (typeof row.fullName !== "string" || row.fullName.length === 0) return false;
    if (row.terminalPersonId !== null && typeof row.terminalPersonId !== "string") return false;
    if (row.random !== undefined && typeof row.random !== "boolean") return false;
    return true;
}

function randomInt(minInclusive: number, maxInclusive: number) {
    return minInclusive + Math.floor(Math.random() * (maxInclusive - minInclusive + 1));
}

export function loadPeopleCatalogFromJson(): TerminalPerson[] {
    const path = new URL("../terminal-people.json", import.meta.url);
    const raw = fs.readFileSync(path, "utf8");
    const payload = JSON.parse(raw);
    if (!Array.isArray(payload)) {
        throw new Error("Invalid terminal people catalog: expected array");
    }

    const people: TerminalPerson[] = payload.map((row, index) => {
        if (!isTerminalPerson(row)) {
            throw new Error(`Invalid terminal people catalog at index ${index}`);
        }
        if (!row.random && (!row.terminalPersonId || row.terminalPersonId.length === 0)) {
            throw new Error(`Invalid terminal people catalog at index ${index}: terminalPersonId required`);
        }
        return row;
    });

    return people;
}

export function createPeopleCatalog(people: TerminalPerson[]): PeopleCatalog {
    if (people.length === 0) {
        throw new Error("Terminal people catalog must not be empty");
    }

    return {
        pickRandomPeople(count) {
            const safeCount = Math.max(1, count);
            const picked: TerminalPerson[] = [];
            for (let i = 0; i < safeCount; i += 1) {
                const index = randomInt(0, people.length - 1);
                picked.push(people[index]!);
            }
            return picked;
        },
        resolveTerminalPersonId(person) {
            if (person.random) {
                return `TP-${randomInt(100000, 999999)}`;
            }
            return person.terminalPersonId!;
        }
    };
}
