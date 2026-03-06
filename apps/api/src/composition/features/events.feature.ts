import type {
    AccessEventIngestBatchInput,
    AccessEventIngestInput,
    AccessEventIngestResult,
    AccessEventStatusDto,
    ListAccessEventsResultDto,
    ListUnmatchedAccessEventsResultDto
} from "@school-gate/contracts";
import {
    createAccessEventsService,
    createIngestAccessEventUC,
    createInlineAccessEventQueue,
    createListAccessEventsAdminUC,
    createMapPersonTerminalIdentityUC,
    createPersonTerminalIdentitiesService,
    createPersonsService,
    createProcessAccessEventByIdUC,
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
import { verifyIngestAuth } from "../../delivery/http/middleware/verifyIngestAuth.js";
import type { AccessEventsAdminModule } from "../../delivery/http/routes/accessEventsAdmin.routes.js";
import type { AccessEventsRoutesInput } from "../../delivery/http/routes/accessEvents.routes.js";
import type { DeviceServiceGatewayModule } from "../../delivery/http/routes/deviceServiceGateway.routes.js";
import type { PersonsModule } from "../../delivery/http/routes/persons.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";
import { UnexpectedIngestStatusError } from "../errors/unexpectedIngestStatus.error.js";
import { createPersonsFeature } from "./persons/persons.feature.js";

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
    const outbox = createOutbox(runtime.dbClient.db);
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
        outbox,
        idGen: runtime.idGen,
        clock: runtime.clock,
        inlineQueue
    });
    const mapPersonTerminalIdentity = createMapPersonTerminalIdentityUC({
        personsService,
        personTerminalIdentitiesService,
        accessEventsService,
        outbox,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const persons = createPersonsFeature(runtime, deviceServiceGateway);
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
        persons
    };
}
