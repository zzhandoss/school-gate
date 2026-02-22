import type {
    ApplyPersonAutoIdentitiesDto,
    ApplyPersonAutoIdentitiesResultDto,
    AccessEventIngestBatchInput,
    AccessEventStatusDto,
    AccessEventIngestResult,
    AccessEventIngestInput,
    CreatePersonDto,
    GetPersonResultDto,
    ListAccessEventsResultDto,
    ListUnmatchedAccessEventsResultDto,
    ListPersonsResultDto,
    ListPersonIdentitiesResultDto,
    PreviewPersonAutoIdentitiesByIinDto,
    PreviewPersonAutoIdentitiesByIinResultDto,
    PreviewPersonAutoIdentitiesResultDto,
    SearchPersonsByIinResultDto
} from "@school-gate/contracts";
import {
    enqueueAuditRequested,
    PersonNotFoundError,
    TerminalIdentityAlreadyMappedError,
    createIngestAccessEventUC,
    createInlineAccessEventQueue,
    createListAccessEventsAdminUC,
    createMapPersonTerminalIdentityUC,
    createPersonTerminalIdentitiesService,
    createPersonsService,
    createProcessAccessEventByIdUC,
    createAccessEventsService,
    type IngestAccessEventInput,
    type ProcessAccessEventsTx
} from "@school-gate/core";
import {
    createAccessEventsAdminQuery,
    createAccessEventsRepo,
    createOutbox,
    createPersonTerminalIdentitiesRepo,
    createPersonsRepo,
    createSubscriptionsRepo,
    createUnitOfWork
} from "@school-gate/infra";
import { HttpError } from "../../delivery/http/errors/httpError.js";
import { verifyIngestAuth } from "../../delivery/http/middleware/verifyIngestAuth.js";
import type { AccessEventsAdminModule } from "../../delivery/http/routes/accessEventsAdmin.routes.js";
import type { AccessEventsRoutesInput } from "../../delivery/http/routes/accessEvents.routes.js";
import type { DeviceServiceGatewayModule } from "../../delivery/http/routes/deviceServiceGateway.routes.js";
import type { PersonsModule } from "../../delivery/http/routes/persons.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";
import { UnexpectedIngestStatusError } from "../errors/unexpectedIngestStatus.error.js";

function toIngestInput(input: AccessEventIngestInput): IngestAccessEventInput {
    const mapped: IngestAccessEventInput = {
        eventId: input.eventId,
        deviceId: input.deviceId,
        direction: input.direction,
        occurredAt: new Date(input.occurredAt)
    };
    if (input.terminalPersonId !== undefined) mapped.terminalPersonId = input.terminalPersonId;
    if (input.iin !== undefined) mapped.iin = input.iin;
    if (input.rawPayload !== undefined) mapped.rawPayload = input.rawPayload;
    return mapped;
}

function createProcessEventsTx(runtime: ApiRuntime): ProcessAccessEventsTx {
    return createUnitOfWork(runtime.dbClient.db, {
        accessEventsService: (db) => createAccessEventsService({ accessEventsRepo: createAccessEventsRepo(db) }),
        outbox: createOutbox
    });
}

function mapPersonDto(person: {
    id: string;
    iin: string;
    terminalPersonId: string | null;
    hasDeviceIdentities?: boolean;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
}) {
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

function mapAccessEventStatus(status: string): AccessEventStatusDto {
    switch (status) {
        case "NEW":
        case "PROCESSING":
        case "PROCESSED":
        case "FAILED_RETRY":
        case "UNMATCHED":
        case "ERROR":
            return status;
        default:
            return "ERROR";
    }
}

export function createEventsFeature(runtime: ApiRuntime, deviceServiceGateway: DeviceServiceGatewayModule): {
    accessEvents: AccessEventsRoutesInput;
    accessEventsAdmin: AccessEventsAdminModule;
    persons: PersonsModule;
} {
    const accessEventsService = createAccessEventsService({
        accessEventsRepo: createAccessEventsRepo(runtime.dbClient.db)
    });
    const personsService = createPersonsService({
        personsRepo: createPersonsRepo(runtime.dbClient.db)
    });
    const personTerminalIdentitiesService = createPersonTerminalIdentitiesService({
        personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo(runtime.dbClient.db)
    });
    const processAccessEventById = createProcessAccessEventByIdUC({
        accessEventsService,
        personsRepo: createPersonsRepo(runtime.dbClient.db),
        personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo(runtime.dbClient.db),
        subscriptionsRepo: createSubscriptionsRepo(runtime.dbClient.db),
        tx: createProcessEventsTx(runtime),
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const listAccessEventsAdmin = createListAccessEventsAdminUC({
        accessEventsAdminQuery: createAccessEventsAdminQuery(runtime.dbClient.db)
    });

    const processingByInline = `${runtime.accessCfg.processingBy}:inline`;
    const inlineQueue = createInlineAccessEventQueue({
        maxInFlight: runtime.apiConfig.accessEventsInlineMaxInFlight,
        processById: (id) =>
            processAccessEventById({
                id,
                leaseMs: runtime.accessCfg.leaseMs,
                retryDelayMs: runtime.accessCfg.retryDelayMs,
                maxAttempts: runtime.accessCfg.maxAttempts,
                processingBy: processingByInline
            }).then(() => {}),
        onError: (err) => {
            runtime.logger.error({ err }, "inline access event processing failed");
        }
    });

    const ingestAccessEvent = createIngestAccessEventUC({
        accessEventsService,
        personsService,
        personTerminalIdentitiesService,
        outbox: createOutbox(runtime.dbClient.db),
        idGen: runtime.idGen,
        clock: runtime.clock,
        inlineQueue
    });
    const outbox = createOutbox(runtime.dbClient.db);
    const mapPersonTerminalIdentity = createMapPersonTerminalIdentityUC({
        personsService,
        personTerminalIdentitiesService,
        accessEventsService,
        outbox,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const ingestOne = async (input: AccessEventIngestInput): Promise<AccessEventIngestResult> => {
        const result = await ingestAccessEvent(toIngestInput(input));
        if (result.status !== "NEW" && result.status !== "UNMATCHED") {
            throw new UnexpectedIngestStatusError(result.status);
        }

        return {
            result: result.result,
            status: result.status,
            personId: result.personId,
            accessEventId: result.accessEventId
        };
    };

    return {
        accessEvents: {
            verifyIngestAuth: verifyIngestAuth({
                token: runtime.apiConfig.coreToken,
                hmacSecret: runtime.apiConfig.coreHmacSecret,
                windowMs: runtime.apiConfig.coreHmacWindowMs
            }),
            module: {
                ingest: (input) => ingestOne(input),
                ingestBatch: async (input: AccessEventIngestBatchInput) => {
                    const results: Array<AccessEventIngestResult & { eventId: string }> = [];
                    for (const event of input.events) {
                        const result = await ingestOne(event);
                        results.push({ eventId: event.eventId, ...result });
                    }
                    return { results };
                }
            }
        },
        accessEventsAdmin: {
            list: async (input) => {
                const result = await listAccessEventsAdmin({
                    limit: input.limit,
                    offset: input.offset,
                    ...(input.status ? { status: input.status } : {}),
                    ...(input.direction ? { direction: input.direction } : {}),
                    ...(input.deviceId ? { deviceId: input.deviceId } : {}),
                    ...(input.iin ? { iin: input.iin } : {}),
                    ...(input.terminalPersonId ? { terminalPersonId: input.terminalPersonId } : {}),
                    ...(input.from ? { from: new Date(input.from) } : {}),
                    ...(input.to ? { to: new Date(input.to) } : {})
                });

                const data: ListAccessEventsResultDto = {
                    events: result.events.map((event) => ({
                        id: event.id,
                        deviceId: event.deviceId,
                        direction: event.direction,
                        occurredAt: event.occurredAt.toISOString(),
                        terminalPersonId: event.terminalPersonId,
                        iin: event.iin,
                        status: mapAccessEventStatus(event.status),
                        attempts: event.attempts,
                        lastError: event.lastError,
                        person: event.person ? {
                            id: event.person.id,
                            iin: event.person.iin,
                            firstName: event.person.firstName,
                            lastName: event.person.lastName
                        } : null,
                        processedAt: event.processedAt ? event.processedAt.toISOString() : null,
                        createdAt: event.createdAt.toISOString()
                    })),
                    page: {
                        limit: input.limit,
                        offset: input.offset,
                        total: result.total
                    }
                };
                return data;
            },
            listUnmatched: async ({ limit }) => {
                const events = await accessEventsService.listUnmatched({ limit });
                const data: ListUnmatchedAccessEventsResultDto = {
                    events: events.map((event) => ({
                        id: event.id,
                        deviceId: event.deviceId,
                        direction: event.direction,
                        occurredAt: event.occurredAt.toISOString(),
                        terminalPersonId: event.terminalPersonId,
                        iin: event.iin,
                        status: "UNMATCHED",
                        createdAt: event.createdAt.toISOString()
                    }))
                };
                return data;
            },
            mapTerminalIdentity: (input) => mapPersonTerminalIdentity(input)
        },
        persons: {
            list: async (input) => {
                const [persons, total] = await Promise.all([
                    personsService.list({
                        limit: input.limit,
                        offset: input.offset,
                        ...(input.iin ? { iin: input.iin } : {}),
                        ...(input.query ? { query: input.query } : {})
                    }),
                    personsService.count({
                        ...(input.iin ? { iin: input.iin } : {}),
                        ...(input.query ? { query: input.query } : {})
                    })
                ]);
                const identityCounts = await Promise.all(
                    persons.map(async (person) => {
                        const list = await personTerminalIdentitiesService.listByPersonId({ personId: person.id });
                        return [person.id, list.length] as const;
                    })
                );
                const hasDeviceIdentitiesByPersonId = new Map(
                    identityCounts.map(([personId, count]) => [personId, count > 0])
                );

                const data: ListPersonsResultDto = {
                    persons: persons.map((person) =>
                        mapPersonDto({
                            ...person,
                            hasDeviceIdentities: hasDeviceIdentitiesByPersonId.get(person.id) ?? false
                        })
                    ),
                    page: {
                        limit: input.limit,
                        offset: input.offset,
                        total
                    }
                };
                return data;
            },
            getById: async ({ personId }) => {
                const person = await personsService.getById(personId);
                if (!person) {
                    throw new PersonNotFoundError();
                }
                const data: GetPersonResultDto = { person: mapPersonDto(person) };
                return data;
            },
            create: async (input: CreatePersonDto) => {
                const existing = await personsService.getByIin(input.iin);
                if (existing) {
                    throw new HttpError({
                        status: 409,
                        code: "person_iin_exists",
                        message: "Person with this IIN already exists"
                    });
                }

                await personsService.create({
                    id: runtime.idGen.nextId(),
                    iin: input.iin,
                    firstName: input.firstName ?? null,
                    lastName: input.lastName ?? null
                });

                const created = await personsService.getByIin(input.iin);
                if (!created) {
                    throw new HttpError({
                        status: 500,
                        code: "person_create_failed",
                        message: "Failed to create person"
                    });
                }

                const data: GetPersonResultDto = { person: mapPersonDto(created) };
                return data;
            },
            update: async ({ personId, patch }) => {
                const current = await personsService.getById(personId);
                if (!current) {
                    throw new PersonNotFoundError();
                }

                if (patch.iin && patch.iin !== current.iin) {
                    const existing = await personsService.getByIin(patch.iin);
                    if (existing && existing.id !== personId) {
                        throw new HttpError({
                            status: 409,
                            code: "person_iin_exists",
                            message: "Person with this IIN already exists"
                        });
                    }
                }

                await personsService.updateById({
                    id: personId,
                    ...(patch.iin !== undefined ? { iin: patch.iin } : {}),
                    ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
                    ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {})
                });
                const updated = await personsService.getById(personId);
                if (!updated) {
                    throw new PersonNotFoundError();
                }
                const data: GetPersonResultDto = { person: mapPersonDto(updated) };
                return data;
            },
            listIdentities: async ({ personId }) => {
                const person = await personsService.getById(personId);
                if (!person) {
                    throw new PersonNotFoundError();
                }

                const identities = await personTerminalIdentitiesService.listByPersonId({ personId });
                const data: ListPersonIdentitiesResultDto = {
                    identities: identities.map((identity) => ({
                        id: identity.id,
                        personId: identity.personId,
                        deviceId: identity.deviceId,
                        terminalPersonId: identity.terminalPersonId,
                        createdAt: identity.createdAt.toISOString()
                    }))
                };
                return data;
            },
            createIdentity: async ({ personId, body }) => {
                const person = await personsService.getById(personId);
                if (!person) {
                    throw new PersonNotFoundError();
                }

                const existingByTerminal = await personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
                    deviceId: body.deviceId,
                    terminalPersonId: body.terminalPersonId
                });
                if (existingByTerminal && existingByTerminal.personId !== personId) {
                    throw new TerminalIdentityAlreadyMappedError();
                }

                const existingByPersonAndDevice = await personTerminalIdentitiesService.getByPersonAndDevice({
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

                await personTerminalIdentitiesService.create({
                    id: runtime.idGen.nextId(),
                    personId,
                    deviceId: body.deviceId,
                    terminalPersonId: body.terminalPersonId
                });
            },
            updateIdentity: async ({ personId, identityId, body }) => {
                const identity = await personTerminalIdentitiesService.getById({ id: identityId });
                if (!identity || identity.personId !== personId) {
                    throw new HttpError({
                        status: 404,
                        code: "person_identity_not_found",
                        message: "Person identity was not found"
                    });
                }

                const existingByTerminal = await personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
                    deviceId: body.deviceId,
                    terminalPersonId: body.terminalPersonId
                });
                if (existingByTerminal && existingByTerminal.personId !== personId) {
                    throw new TerminalIdentityAlreadyMappedError();
                }

                const existingByPersonAndDevice = await personTerminalIdentitiesService.getByPersonAndDevice({
                    personId,
                    deviceId: body.deviceId
                });
                if (existingByPersonAndDevice && existingByPersonAndDevice.id !== identityId) {
                    throw new HttpError({
                        status: 409,
                        code: "person_device_identity_exists",
                        message: "Person already has identity for this device"
                    });
                }

                await personTerminalIdentitiesService.updateById({
                    id: identityId,
                    deviceId: body.deviceId,
                    terminalPersonId: body.terminalPersonId
                });
            },
            deleteIdentity: async ({ personId, identityId }) => {
                const identity = await personTerminalIdentitiesService.getById({ id: identityId });
                if (!identity || identity.personId !== personId) {
                    throw new HttpError({
                        status: 404,
                        code: "person_identity_not_found",
                        message: "Person identity was not found"
                    });
                }
                await personTerminalIdentitiesService.deleteById({ id: identityId });
            },
            previewAutoIdentities: async ({ personId, adminId, authorizationHeader }) => {
                const person = await personsService.getById(personId);
                if (!person) {
                    throw new PersonNotFoundError();
                }

                const found = await deviceServiceGateway.findIdentity({
                    payload: {
                        identityKey: "iin",
                        identityValue: person.iin,
                        limit: 1
                    },
                    authorizationHeader,
                    admin: undefined
                });

                const identities = await personTerminalIdentitiesService.listByPersonId({ personId });
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

                enqueueAuditRequested({
                    outbox,
                    id: runtime.idGen.nextId(),
                    actorId: adminId ?? "system:auto_identity_preview",
                    action: "person_identity_auto_resolve_attempted",
                    entityType: "person",
                    entityId: personId,
                    at: runtime.clock.now(),
                    meta: {
                        personId,
                        identityKey: "iin",
                        matches: found.matches.length,
                        errors: found.errors.length,
                        diagnostics: found.diagnostics
                    }
                });

                return data;
            },
            previewAutoIdentitiesByIin: async ({ body, adminId, authorizationHeader }) => {
                const found = await deviceServiceGateway.findIdentity({
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
                        alreadyLinked: false,
                    })),
                    diagnostics: found.diagnostics,
                    errors: found.errors
                };

                enqueueAuditRequested({
                    outbox,
                    id: runtime.idGen.nextId(),
                    actorId: adminId ?? "system:auto_identity_preview_by_iin",
                    action: "person_identity_auto_resolve_attempted_by_iin",
                    entityType: "person",
                    entityId: body.iin,
                    at: runtime.clock.now(),
                    meta: {
                        iin: body.iin,
                        identityKey: "iin",
                        matches: found.matches.length,
                        errors: found.errors.length,
                        diagnostics: found.diagnostics
                    }
                });

                return data;
            },
            applyAutoIdentities: async ({ personId, body, adminId }) => {
                const person = await personsService.getById(personId);
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
                        const mapped = await mapPersonTerminalIdentity({
                            personId,
                            deviceId: identity.deviceId,
                            terminalPersonId: identity.terminalPersonId,
                            adminId,
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
                                message: "Terminal identity is linked to another person",
                            });
                            continue;
                        }
                        errors += 1;
                        results.push({
                            ...identity,
                            status: "error",
                            message: error instanceof Error ? error.message : String(error),
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
                    results,
                };

                enqueueAuditRequested({
                    outbox,
                    id: runtime.idGen.nextId(),
                    actorId: adminId ?? "system:auto_identity_apply",
                    action: "person_identity_auto_resolve_applied",
                    entityType: "person",
                    entityId: personId,
                    at: runtime.clock.now(),
                    meta: {
                        personId,
                        total: data.total,
                        linked,
                        alreadyLinked,
                        conflicts,
                        errors,
                    },
                });

                return data;
            },
            searchByIin: async (input) => {
                const persons = await personsService.searchByIin(input);
                const data: SearchPersonsByIinResultDto = {
                    persons: persons.map(mapPersonDto)
                };
                return data;
            }
        }
    };
}
