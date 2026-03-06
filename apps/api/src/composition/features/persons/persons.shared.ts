import type { PersonsModule } from "../../../delivery/http/routes/persons/persons.types.js";

type PersonDtoSource = {
    id: string;
    iin: string;
    terminalPersonId: string | null;
    hasDeviceIdentities?: boolean;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
};

export function mapPersonDto(person: PersonDtoSource) {
    return {
        id: person.id,
        iin: person.iin,
        terminalPersonId: person.terminalPersonId,
        ...(person.hasDeviceIdentities !== undefined ? { hasDeviceIdentities: person.hasDeviceIdentities } : {}),
        firstName: person.firstName,
        lastName: person.lastName,
        createdAt: person.createdAt.toISOString()
    };
}

function parseCsvIds(value: string | undefined) {
    if (!value) {
        return undefined;
    }

    const items = Array.from(
        new Set(
            value
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    );

    return items.length > 0 ? items : undefined;
}

export function toListPersonsAdminInput(input: Parameters<PersonsModule["list"]>[0]) {
    const includeDeviceIds = parseCsvIds(input.includeDeviceIds) ?? parseCsvIds(input.deviceId);
    const excludeDeviceIds = parseCsvIds(input.excludeDeviceIds);

    return {
        limit: input.limit,
        offset: input.offset,
        ...(input.iin ? { iin: input.iin } : {}),
        ...(input.query ? { query: input.query } : {}),
        ...(input.linkedStatus ? { linkedStatus: input.linkedStatus } : {}),
        ...(includeDeviceIds ? { includeDeviceIds } : {}),
        ...(excludeDeviceIds ? { excludeDeviceIds } : {})
    };
}
