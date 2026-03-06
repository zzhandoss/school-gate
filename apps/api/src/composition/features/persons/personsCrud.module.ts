import type {
    BulkDeletePersonsDto,
    BulkDeletePersonsResultDto,
    CreatePersonDto,
    DeletePersonResultDto,
    GetPersonResultDto,
    ListPersonsResultDto,
    SearchPersonsByIinResultDto
} from "@school-gate/contracts";
import { PersonNotFoundError } from "@school-gate/core";
import { HttpError } from "../../../delivery/http/errors/httpError.js";
import type {
    PersonsCrudModule,
    PersonsListModule
} from "../../../delivery/http/routes/persons/persons.types.js";
import { mapPersonDto, toListPersonsAdminInput } from "./persons.shared.js";

type PersonRecord = {
    id: string;
    iin: string;
    terminalPersonId: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
};

type PersonsCrudDeps = {
    nextId: () => string;
    personsService: {
        getById: (personId: string) => Promise<PersonRecord | null>;
        getByIin: (iin: string) => Promise<PersonRecord | null>;
        create: (input: { id: string; iin: string; firstName: string | null; lastName: string | null }) => Promise<void>;
        updateById: (input: { id: string; iin?: string; firstName?: string | null; lastName?: string | null }) => Promise<void>;
        searchByIin: (input: { iin: string; limit: number }) => Promise<PersonRecord[]>;
    };
    listPersonsAdmin: (input: ReturnType<typeof toListPersonsAdminInput>) => Promise<{
        persons: Array<PersonRecord & { hasDeviceIdentities: boolean }>;
        total: number;
    }>;
    deletePerson: (input: { personId: string; adminId?: string }) => Promise<DeletePersonResultDto>;
    bulkDeletePersons: (input: { personIds: BulkDeletePersonsDto["personIds"]; adminId?: string }) => Promise<BulkDeletePersonsResultDto>;
};

export function createPersonsCrudModule(deps: PersonsCrudDeps): PersonsListModule & PersonsCrudModule {
    return {
        list: async (input) => {
            const result = await deps.listPersonsAdmin(toListPersonsAdminInput(input));
            return {
                persons: result.persons.map((person) => mapPersonDto(person)),
                page: {
                    limit: input.limit,
                    offset: input.offset,
                    total: result.total
                }
            } satisfies ListPersonsResultDto;
        },
        getById: async ({ personId }) => {
            const person = await deps.personsService.getById(personId);
            if (!person) {
                throw new PersonNotFoundError();
            }

            return { person: mapPersonDto(person) } satisfies GetPersonResultDto;
        },
        deleteById: async ({ personId, adminId }) => deps.deletePerson({
            personId,
            ...(adminId !== undefined ? { adminId } : {})
        }),
        bulkDelete: async ({ body, adminId }) => deps.bulkDeletePersons({
            personIds: body.personIds,
            ...(adminId !== undefined ? { adminId } : {})
        }),
        create: async (input: CreatePersonDto) => {
            const existing = await deps.personsService.getByIin(input.iin);
            if (existing) {
                throw new HttpError({
                    status: 409,
                    code: "person_iin_exists",
                    message: "Person with this IIN already exists"
                });
            }

            await deps.personsService.create({
                id: deps.nextId(),
                iin: input.iin,
                firstName: input.firstName ?? null,
                lastName: input.lastName ?? null
            });

            const created = await deps.personsService.getByIin(input.iin);
            if (!created) {
                throw new HttpError({
                    status: 500,
                    code: "person_create_failed",
                    message: "Failed to create person"
                });
            }

            return { person: mapPersonDto(created) } satisfies GetPersonResultDto;
        },
        update: async ({ personId, patch }) => {
            const current = await deps.personsService.getById(personId);
            if (!current) {
                throw new PersonNotFoundError();
            }

            if (patch.iin && patch.iin !== current.iin) {
                const existing = await deps.personsService.getByIin(patch.iin);
                if (existing && existing.id !== personId) {
                    throw new HttpError({
                        status: 409,
                        code: "person_iin_exists",
                        message: "Person with this IIN already exists"
                    });
                }
            }

            await deps.personsService.updateById({
                id: personId,
                ...(patch.iin !== undefined ? { iin: patch.iin } : {}),
                ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
                ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {})
            });

            const updated = await deps.personsService.getById(personId);
            if (!updated) {
                throw new PersonNotFoundError();
            }

            return { person: mapPersonDto(updated) } satisfies GetPersonResultDto;
        },
        searchByIin: async (input) => {
            const persons = await deps.personsService.searchByIin(input);
            return {
                persons: persons.map(mapPersonDto)
            } satisfies SearchPersonsByIinResultDto;
        }
    };
}
