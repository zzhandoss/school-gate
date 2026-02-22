import type {
    AccessEventsRetentionService,
    AccessEventsRetentionServiceDeps,
} from "./accessEventsRetention.types.js";

export function createAccessEventsRetentionService(
    deps: AccessEventsRetentionServiceDeps
): AccessEventsRetentionService {
    return {
        withTx(tx: unknown) {
            return createAccessEventsRetentionService({
                ...deps,
                accessEventsRetentionRepo: deps.accessEventsRetentionRepo.withTx(tx),
            });
        },



        deleteTerminalBefore(input) {
            return deps.accessEventsRetentionRepo.deleteTerminalBefore(input);
        },
    };
}


