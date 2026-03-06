import {
    createAccessEventsService,
    createDeletePersonFlow,
    createDeletePersonsBulkFlow,
    createListPersonsAdminUC,
    createMapPersonTerminalIdentityUC,
    createPersonTerminalIdentitiesService,
    createPersonsService,
    enqueueAuditRequested
} from "@school-gate/core";
import {
    createAccessEventsRepo,
    createOutbox,
    createPersonTerminalIdentitiesRepo,
    createPersonsAdminQuery,
    createPersonsRepo,
    createSubscriptionRequestsRepo,
    createSubscriptionsRepo,
    createTerminalDirectoryEntriesRepo,
    createTerminalDirectorySyncRunsRepo,
    createUnitOfWork
} from "@school-gate/infra";
import type { DeviceServiceGatewayModule } from "../../../delivery/http/routes/deviceServiceGateway.routes.js";
import type { PersonsModule } from "../../../delivery/http/routes/persons/persons.types.js";
import type { ApiRuntime } from "../../../runtime/createRuntime.js";
import { createPersonsTerminalSyncModule } from "../personsTerminalSync.feature.js";
import { createPersonsCrudModule } from "./personsCrud.module.js";
import { createPersonsIdentityCrudModule } from "./personsIdentityCrud.module.js";
import { createPersonsIdentityModule } from "./personsIdentity.module.js";
import { createPersonsImportApplyModule } from "./personsImportApply.module.js";
import { createPersonsImportReviewModule } from "./personsImportReview.module.js";
import { createPersonsImportRunModule } from "./personsImportRun.module.js";
import { createPersonsTerminalUsersModule } from "./personsTerminalUsers.module.js";

export function createPersonsFeature(
    runtime: ApiRuntime,
    deviceServiceGateway: DeviceServiceGatewayModule
): PersonsModule {
    const outbox = createOutbox(runtime.dbClient.db);
    const accessEventsService = createAccessEventsService({
        accessEventsRepo: createAccessEventsRepo(runtime.dbClient.db)
    });
    const personsService = createPersonsService({
        personsRepo: createPersonsRepo(runtime.dbClient.db)
    });
    const personTerminalIdentitiesService = createPersonTerminalIdentitiesService({
        personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo(runtime.dbClient.db)
    });
    const terminalDirectoryEntriesRepo = createTerminalDirectoryEntriesRepo(runtime.dbClient.db);
    const terminalDirectorySyncRunsRepo = createTerminalDirectorySyncRunsRepo(runtime.dbClient.db);
    const listPersonsAdmin = createListPersonsAdminUC({
        personsAdminQuery: createPersonsAdminQuery(runtime.dbClient.db)
    });
    const mapPersonTerminalIdentity = createMapPersonTerminalIdentityUC({
        personsService,
        personTerminalIdentitiesService,
        accessEventsService,
        outbox,
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const terminalSync = createPersonsTerminalSyncModule({
        personsService,
        personTerminalIdentitiesService,
        deviceServiceGateway,
        nextId: () => runtime.idGen.nextId(),
        now: () => runtime.clock.now(),
        enqueueAudit: ({ action, entityId, actorId, meta }) =>
            enqueueAudit({
                runtime,
                outbox,
                actorId,
                action,
                entityType: "person",
                entityId,
                meta
            })
    });
    const deletePerson = createDeletePersonFlow({
        personsService,
        tx: createUnitOfWork(runtime.dbClient.db, {
            personsRepo: createPersonsRepo,
            personTerminalIdentitiesRepo: createPersonTerminalIdentitiesRepo,
            subscriptionsRepo: createSubscriptionsRepo,
            subscriptionRequestsRepo: createSubscriptionRequestsRepo,
            outbox: createOutbox
        }),
        idGen: runtime.idGen,
        clock: runtime.clock
    });
    const bulkDeletePersons = createDeletePersonsBulkFlow({
        deletePerson
    });
    const enqueue = (input: {
        actorId: string;
        action: string;
        entityType: string;
        entityId: string;
        meta: Record<string, unknown>;
    }) => enqueueAudit({ runtime, outbox, ...input });

    return {
        ...createPersonsCrudModule({
            nextId: () => runtime.idGen.nextId(),
            personsService,
            listPersonsAdmin,
            deletePerson,
            bulkDeletePersons
        }),
        ...createPersonsIdentityModule({
            personsService,
            personTerminalIdentitiesService,
            deviceServiceGateway,
            mapPersonTerminalIdentity,
            enqueueAudit: enqueue
        }),
        ...createPersonsIdentityCrudModule({
            nextId: () => runtime.idGen.nextId(),
            personsService,
            personTerminalIdentitiesService
        }),
        ...createPersonsImportRunModule({
            nextId: () => runtime.idGen.nextId(),
            now: () => runtime.clock.now(),
            deviceServiceGateway,
            terminalDirectorySyncRunsRepo,
            terminalDirectoryEntriesRepo,
            enqueueAudit: enqueue
        }),
        ...createPersonsImportReviewModule({
            personsService,
            personTerminalIdentitiesService,
            terminalDirectoryEntriesRepo
        }),
        ...createPersonsImportApplyModule({
            nextId: () => runtime.idGen.nextId(),
            personsService,
            personTerminalIdentitiesService,
            terminalDirectoryEntriesRepo,
            mapPersonTerminalIdentity,
            enqueueAudit: enqueue
        }),
        ...createPersonsTerminalUsersModule({
            terminalSync
        })
    };
}

function enqueueAudit(input: {
    runtime: ApiRuntime;
    outbox: ReturnType<typeof createOutbox>;
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    meta: Record<string, unknown>;
}) {
    enqueueAuditRequested({
        outbox: input.outbox,
        id: input.runtime.idGen.nextId(),
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        at: input.runtime.clock.now(),
        meta: input.meta
    });
}
