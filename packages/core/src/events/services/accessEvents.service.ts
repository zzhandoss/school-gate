import type { AccessEventsService, AccessEventsServiceDeps } from "./accessEvents.types.js";

export function createAccessEventsService(deps: AccessEventsServiceDeps): AccessEventsService {
    return {
        withTx(tx: unknown) {
            return createAccessEventsService({
                ...deps,
                accessEventsRepo: deps.accessEventsRepo.withTx(tx),
            });
        },



        insertIdempotent(input) {
            return deps.accessEventsRepo.insertIdempotent(input);
        },
        listDueForProcessing(input) {
            return deps.accessEventsRepo.listDueForProcessing(input);
        },
        list(input) {
            return deps.accessEventsRepo.list(input);
        },
        listUnmatched(input) {
            return deps.accessEventsRepo.listUnmatched(input);
        },
        claimBatch(input) {
            return deps.accessEventsRepo.claimBatch(input);
        },
        claimById(input) {
            return deps.accessEventsRepo.claimById(input);
        },
        markProcessed(input) {
            return deps.accessEventsRepo.markProcessed(input);
        },
        markProcessedSync(input) {
            return deps.accessEventsRepo.markProcessedSync(input);
        },
        markUnmatched(input) {
            return deps.accessEventsRepo.markUnmatched(input);
        },
        markFailed(input) {
            return deps.accessEventsRepo.markFailed(input);
        },
        markReadyByTerminalIdentity(input) {
            return deps.accessEventsRepo.markReadyByTerminalIdentity(input);
        },
        deleteOlderThan(input) {
            return deps.accessEventsRepo.deleteOlderThan(input);
        },
    };
}


