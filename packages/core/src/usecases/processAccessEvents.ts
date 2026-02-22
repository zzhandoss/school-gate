import {
    createProcessAccessEventByIdUC as createModernProcessAccessEventByIdUC,
    createProcessAccessEventsUC as createModernProcessAccessEventsUC
} from "./events/processAccessEvents.js";
import { createAccessEventsService } from "../events/services/accessEvents.service.js";
import type { OutboxRepo } from "../ports/outbox.js";

function adaptTx(legacyTx: any) {
    return {
        run<T>(cb: (deps: { accessEventsService: ReturnType<typeof createAccessEventsService>; outbox: OutboxRepo }) => T) {
            return legacyTx.run((txDeps: { accessEventsRepo?: any; accessEventsService?: ReturnType<typeof createAccessEventsService>; outbox: OutboxRepo }) => {
                const accessEventsService = txDeps.accessEventsService
                    ?? createAccessEventsService({ accessEventsRepo: txDeps.accessEventsRepo });
                return cb({
                    accessEventsService,
                    outbox: txDeps.outbox
                });
            });
        }
    };
}

function normalizeDeps(deps: any) {
    if ("accessEventsService" in deps) {
        return deps;
    }

    return {
        accessEventsService: createAccessEventsService({ accessEventsRepo: deps.accessEventsRepo }),
        personsRepo: deps.personsRepo,
        personTerminalIdentitiesRepo: deps.personTerminalIdentitiesRepo,
        subscriptionsRepo: deps.subscriptionsRepo,
        tx: adaptTx(deps.tx),
        idGen: deps.idGen,
        clock: deps.clock
    };
}

export function createProcessAccessEventsUC(deps: any) {
    return createModernProcessAccessEventsUC(normalizeDeps(deps));
}

export function createProcessAccessEventByIdUC(deps: any) {
    return createModernProcessAccessEventByIdUC(normalizeDeps(deps));
}
