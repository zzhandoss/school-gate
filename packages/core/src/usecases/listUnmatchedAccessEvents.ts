import { createAccessEventsService } from "../events/services/accessEvents.service.js";
import type { AccessEventsRepo } from "../events/repos/accessEvents.repo.js";

type LegacyDeps = {
    accessEventsRepo: AccessEventsRepo;
};

export function createListUnmatchedAccessEventsUC(deps: LegacyDeps) {
    const accessEventsService = createAccessEventsService({ accessEventsRepo: deps.accessEventsRepo });
    return (input: { limit: number }) => accessEventsService.listUnmatched(input);
}
