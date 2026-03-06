import type { Outbox } from "../../ports/outbox.js";
import type { Clock, IdGenerator } from "../../utils/common.types.js";
import type { PersonTerminalIdentitiesRepo } from "../repos/personTerminalIdentities.repo.js";
import type { PersonsRepo } from "../repos/persons.repo.js";
import type { PersonsService } from "../services/persons.types.js";
import type { SubscriptionRequestsRepo } from "../../subscriptions/repos/subscriptionRequests.repo.js";
import type { SubscriptionsRepo } from "../../subscriptions/repos/subscriptions.repo.js";

export type DeletePersonInput = {
    personId: string;
    adminId?: string;
};

export type DeletePersonResult = {
    personId: string;
    deleted: true;
    detachedIdentities: number;
    deactivatedSubscriptions: number;
    unlinkedRequests: number;
    resetRequestsToNeedsPerson: number;
};

export type DeletePersonTxServices = {
    personsRepo: Pick<PersonsRepo, "deleteByIdSync">;
    personTerminalIdentitiesRepo: Pick<PersonTerminalIdentitiesRepo, "deleteByPersonIdSync">;
    subscriptionsRepo: Pick<SubscriptionsRepo, "deactivateByPersonIdSync">;
    subscriptionRequestsRepo: Pick<SubscriptionRequestsRepo, "unlinkPersonByPersonIdSync">;
    outbox: Outbox;
};

export type DeletePersonTx = {
    run<T>(cb: (deps: DeletePersonTxServices) => T): T;
};

export type DeletePersonFlow = (input: DeletePersonInput) => Promise<DeletePersonResult>;

export type DeletePersonFlowDeps = {
    tx: DeletePersonTx;
    idGen: IdGenerator;
    clock: Clock;
    personsService: Pick<PersonsService, "getById">;
};
