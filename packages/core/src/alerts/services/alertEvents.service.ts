import type { AlertEventsService, AlertEventsServiceDeps } from "./alertEvents.types.js";

export function createAlertEventsService(deps: AlertEventsServiceDeps): AlertEventsService {
    return {
        withTx(tx: unknown) {
            return createAlertEventsService({
                ...deps,
                eventsRepo: deps.eventsRepo.withTx(tx)
            });
        },



        insertSync(input) {
            deps.eventsRepo.insertSync(input);
        },
        list(input) {
            return deps.eventsRepo.list(input);
        },
        listLatestByRuleIds(input) {
            return deps.eventsRepo.listLatestByRuleIds(input);
        }
    };
}


