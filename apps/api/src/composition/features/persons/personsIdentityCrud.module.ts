import { PersonNotFoundError, TerminalIdentityAlreadyMappedError } from "@school-gate/core";
import { HttpError } from "../../../delivery/http/errors/httpError.js";
import type { PersonsIdentityModule } from "../../../delivery/http/routes/persons/persons.types.js";

type PersonsIdentityCrudDeps = {
    nextId: () => string;
    personsService: {
        getById: (personId: string) => Promise<{ id: string } | null>;
    };
    personTerminalIdentitiesService: {
        listByPersonId: (input: { personId: string }) => Promise<Array<{
            id: string;
            personId: string;
            deviceId: string;
            terminalPersonId: string;
            createdAt: Date;
        }>>;
        getByDeviceAndTerminalPersonId: (input: { deviceId: string; terminalPersonId: string }) => Promise<{
            id: string;
            personId: string;
            deviceId: string;
            terminalPersonId: string;
        } | null>;
        getByPersonAndDevice: (input: { personId: string; deviceId: string }) => Promise<{
            id: string;
            personId: string;
            deviceId: string;
            terminalPersonId: string;
        } | null>;
        create: (input: { id: string; personId: string; deviceId: string; terminalPersonId: string }) => Promise<void>;
        getById: (input: { id: string }) => Promise<{
            id: string;
            personId: string;
            deviceId: string;
            terminalPersonId: string;
        } | null>;
        updateById: (input: { id: string; deviceId: string; terminalPersonId: string }) => Promise<void>;
        deleteById: (input: { id: string }) => Promise<void>;
    };
};

export function createPersonsIdentityCrudModule(
    deps: PersonsIdentityCrudDeps
): Pick<PersonsIdentityModule, "listIdentities" | "createIdentity" | "updateIdentity" | "deleteIdentity"> {
    return {
        listIdentities: async ({ personId }) => {
            const person = await deps.personsService.getById(personId);
            if (!person) {
                throw new PersonNotFoundError();
            }

            const identities = await deps.personTerminalIdentitiesService.listByPersonId({ personId });
            return {
                identities: identities.map((identity) => ({
                    id: identity.id,
                    personId: identity.personId,
                    deviceId: identity.deviceId,
                    terminalPersonId: identity.terminalPersonId,
                    createdAt: identity.createdAt.toISOString()
                }))
            };
        },
        createIdentity: async ({ personId, body }) => {
            const person = await deps.personsService.getById(personId);
            if (!person) {
                throw new PersonNotFoundError();
            }

            const existingByTerminal = await deps.personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
                deviceId: body.deviceId,
                terminalPersonId: body.terminalPersonId
            });
            if (existingByTerminal && existingByTerminal.personId !== personId) {
                throw new TerminalIdentityAlreadyMappedError();
            }

            const existingByPersonAndDevice = await deps.personTerminalIdentitiesService.getByPersonAndDevice({
                personId,
                deviceId: body.deviceId
            });
            if (existingByPersonAndDevice) {
                throw new HttpError({
                    status: 409,
                    code: "person_device_identity_exists",
                    message: "Person already has identity for this device"
                });
            }

            await deps.personTerminalIdentitiesService.create({
                id: deps.nextId(),
                personId,
                deviceId: body.deviceId,
                terminalPersonId: body.terminalPersonId
            });
        },
        updateIdentity: async ({ personId, identityId, body }) => {
            const identity = await deps.personTerminalIdentitiesService.getById({ id: identityId });
            if (!identity || identity.personId !== personId) {
                throw new HttpError({
                    status: 404,
                    code: "person_identity_not_found",
                    message: "Person identity was not found"
                });
            }

            const existingByTerminal = await deps.personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
                deviceId: body.deviceId,
                terminalPersonId: body.terminalPersonId
            });
            if (existingByTerminal && existingByTerminal.personId !== personId) {
                throw new TerminalIdentityAlreadyMappedError();
            }

            const existingByPersonAndDevice = await deps.personTerminalIdentitiesService.getByPersonAndDevice({
                personId,
                deviceId: body.deviceId
            });
            if (existingByPersonAndDevice && existingByPersonAndDevice.id !== identityId) {
                throw new HttpError({
                    status: 409,
                    code: "person_device_identity_exists",
                    message: "Person already has another identity on this device"
                });
            }

            await deps.personTerminalIdentitiesService.updateById({
                id: identityId,
                deviceId: body.deviceId,
                terminalPersonId: body.terminalPersonId
            });
        },
        deleteIdentity: async ({ personId, identityId }) => {
            const identity = await deps.personTerminalIdentitiesService.getById({ id: identityId });
            if (!identity || identity.personId !== personId) {
                throw new HttpError({
                    status: 404,
                    code: "person_identity_not_found",
                    message: "Person identity was not found"
                });
            }

            await deps.personTerminalIdentitiesService.deleteById({ id: identityId });
        }
    };
}
