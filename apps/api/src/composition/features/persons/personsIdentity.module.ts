import type {
    ApplyPersonAutoIdentitiesResultDto,
    DeviceServiceIdentityFindResultDto,
    PreviewPersonAutoIdentitiesByIinResultDto,
    PreviewPersonAutoIdentitiesResultDto
} from "@school-gate/contracts";
import { PersonNotFoundError, TerminalIdentityAlreadyMappedError } from "@school-gate/core";
import type { DeviceServiceGatewayModule } from "../../../delivery/http/routes/deviceServiceGateway.routes.js";
import type { PersonsIdentityModule } from "../../../delivery/http/routes/persons/persons.types.js";

type PersonsIdentityDeps = {
    personsService: {
        getById: (personId: string) => Promise<{ id: string; iin: string } | null>;
    };
    personTerminalIdentitiesService: Pick<{
        listByPersonId: (input: { personId: string }) => Promise<Array<{
            id: string;
            personId: string;
            deviceId: string;
            terminalPersonId: string;
        }>>;
    }, "listByPersonId">;
    deviceServiceGateway: Pick<DeviceServiceGatewayModule, "findIdentity">;
    mapPersonTerminalIdentity: (input: {
        personId: string;
        deviceId: string;
        terminalPersonId: string;
        adminId?: string;
    }) => Promise<{ status: "linked" | "already_linked" }>;
    enqueueAudit: (input: {
        actorId: string;
        action: string;
        entityType: string;
        entityId: string;
        meta: Record<string, unknown>;
    }) => void;
};

function toPreviewMeta(found: DeviceServiceIdentityFindResultDto) {
    return {
        matches: found.matches.length,
        errors: found.errors.length,
        diagnostics: found.diagnostics
    };
}

export function createPersonsIdentityModule(
    deps: PersonsIdentityDeps
): Pick<PersonsIdentityModule, "previewAutoIdentities" | "previewAutoIdentitiesByIin" | "applyAutoIdentities"> {
    return {
        previewAutoIdentities: async ({ personId, adminId, authorizationHeader }) => {
            const person = await deps.personsService.getById(personId);
            if (!person) {
                throw new PersonNotFoundError();
            }

            const found = await deps.deviceServiceGateway.findIdentity({
                payload: {
                    identityKey: "iin",
                    identityValue: person.iin,
                    limit: 1
                },
                authorizationHeader,
                admin: undefined
            });

            const identities = await deps.personTerminalIdentitiesService.listByPersonId({ personId });
            const alreadyLinkedSet = new Set(identities.map((item) => `${item.deviceId}:${item.terminalPersonId}`));

            const data: PreviewPersonAutoIdentitiesResultDto = {
                personId,
                identityKey: found.identityKey,
                identityValue: found.identityValue,
                matches: found.matches.map((match) => ({
                    ...match,
                    alreadyLinked: alreadyLinkedSet.has(`${match.deviceId}:${match.terminalPersonId}`)
                })),
                diagnostics: found.diagnostics,
                errors: found.errors
            };

            deps.enqueueAudit({
                actorId: adminId ?? "system:auto_identity_preview",
                action: "person_identity_auto_resolve_attempted",
                entityType: "person",
                entityId: personId,
                meta: {
                    personId,
                    identityKey: "iin",
                    ...toPreviewMeta(found)
                }
            });

            return data;
        },
        previewAutoIdentitiesByIin: async ({ body, adminId, authorizationHeader }) => {
            const found = await deps.deviceServiceGateway.findIdentity({
                payload: {
                    identityKey: "iin",
                    identityValue: body.iin,
                    limit: 1
                },
                authorizationHeader,
                admin: undefined
            });

            const data: PreviewPersonAutoIdentitiesByIinResultDto = {
                iin: body.iin,
                identityKey: found.identityKey,
                identityValue: found.identityValue,
                matches: found.matches.map((match) => ({
                    ...match,
                    alreadyLinked: false
                })),
                diagnostics: found.diagnostics,
                errors: found.errors
            };

            deps.enqueueAudit({
                actorId: adminId ?? "system:auto_identity_preview_by_iin",
                action: "person_identity_auto_resolve_attempted_by_iin",
                entityType: "person",
                entityId: body.iin,
                meta: {
                    iin: body.iin,
                    identityKey: "iin",
                    ...toPreviewMeta(found)
                }
            });

            return data;
        },
        applyAutoIdentities: async ({ personId, body, adminId }) => {
            const person = await deps.personsService.getById(personId);
            if (!person) {
                throw new PersonNotFoundError();
            }

            const results: ApplyPersonAutoIdentitiesResultDto["results"] = [];
            let linked = 0;
            let alreadyLinked = 0;
            let conflicts = 0;
            let errors = 0;

            for (const identity of body.identities) {
                try {
                    const mapped = await deps.mapPersonTerminalIdentity({
                        personId,
                        deviceId: identity.deviceId,
                        terminalPersonId: identity.terminalPersonId,
                        ...(adminId !== undefined ? { adminId } : {})
                    });
                    if (mapped.status === "linked") {
                        linked += 1;
                        results.push({ ...identity, status: "linked" });
                    } else {
                        alreadyLinked += 1;
                        results.push({ ...identity, status: "already_linked" });
                    }
                } catch (error) {
                    if (error instanceof TerminalIdentityAlreadyMappedError) {
                        conflicts += 1;
                        results.push({
                            ...identity,
                            status: "conflict",
                            message: "Terminal identity is linked to another person"
                        });
                        continue;
                    }

                    errors += 1;
                    results.push({
                        ...identity,
                        status: "error",
                        message: error instanceof Error ? error.message : String(error)
                    });
                }
            }

            const data: ApplyPersonAutoIdentitiesResultDto = {
                personId,
                total: body.identities.length,
                linked,
                alreadyLinked,
                conflicts,
                errors,
                results
            };

            deps.enqueueAudit({
                actorId: adminId ?? "system:auto_identity_apply",
                action: "person_identity_auto_resolve_applied",
                entityType: "person",
                entityId: personId,
                meta: {
                    personId,
                    total: data.total,
                    linked,
                    alreadyLinked,
                    conflicts,
                    errors
                }
            });
            return data;
        }
    };
}
