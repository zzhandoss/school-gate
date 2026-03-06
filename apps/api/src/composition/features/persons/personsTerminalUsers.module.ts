import type {
    BulkCreatePersonTerminalUsersDto,
    BulkPersonTerminalSyncResultDto,
    CreatePersonTerminalUsersDto,
    PersonTerminalSyncResultDto,
    UpdatePersonTerminalUsersDto
} from "@school-gate/contracts";
import type { PersonsTerminalUsersModule } from "../../../delivery/http/routes/persons/persons.types.js";

type PersonsTerminalUsersDeps = {
    terminalSync: {
        bulkCreateTerminalUsers: (input: {
            body: BulkCreatePersonTerminalUsersDto;
            adminId?: string;
            authorizationHeader?: string;
        }) => Promise<BulkPersonTerminalSyncResultDto>;
        createTerminalUsers: (input: {
            personId: string;
            body: CreatePersonTerminalUsersDto;
            adminId?: string;
            authorizationHeader?: string;
        }) => Promise<PersonTerminalSyncResultDto>;
        updateTerminalUsers: (input: {
            personId: string;
            body: UpdatePersonTerminalUsersDto;
            adminId?: string;
            authorizationHeader?: string;
        }) => Promise<PersonTerminalSyncResultDto>;
        getTerminalUserPhoto: NonNullable<PersonsTerminalUsersModule["getTerminalUserPhoto"]>;
    };
};

export function createPersonsTerminalUsersModule(
    deps: PersonsTerminalUsersDeps
): PersonsTerminalUsersModule {
    return {
        bulkCreateTerminalUsers: async ({ body, adminId, authorizationHeader }) =>
            deps.terminalSync.bulkCreateTerminalUsers({
                body,
                ...(adminId !== undefined ? { adminId } : {}),
                ...(authorizationHeader !== undefined ? { authorizationHeader } : {})
            }),
        createTerminalUsers: async ({ personId, body, adminId, authorizationHeader }) =>
            deps.terminalSync.createTerminalUsers({
                personId,
                body,
                ...(adminId !== undefined ? { adminId } : {}),
                ...(authorizationHeader !== undefined ? { authorizationHeader } : {})
            }),
        updateTerminalUsers: async ({ personId, body, adminId, authorizationHeader }) =>
            deps.terminalSync.updateTerminalUsers({
                personId,
                body,
                ...(adminId !== undefined ? { adminId } : {}),
                ...(authorizationHeader !== undefined ? { authorizationHeader } : {})
            }),
        getTerminalUserPhoto: async ({ personId, body, authorizationHeader }) =>
            deps.terminalSync.getTerminalUserPhoto({
                personId,
                body,
                ...(authorizationHeader !== undefined ? { authorizationHeader } : {})
            })
    };
}
