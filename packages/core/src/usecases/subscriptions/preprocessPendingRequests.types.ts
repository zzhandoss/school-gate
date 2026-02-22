import type { PersonsService } from "../../identities/index.js";
import type { PersonTerminalIdentitiesService } from "../../identities/index.js";
import type { SubscriptionRequestsService } from "../../subscriptions/index.js";
import type { FeatureFlags } from "../../featureFlags.js";
import type { PersonResolver } from "../../ports/index.js";
import type { Clock, IdGenerator } from "../../utils/index.js";

export type PreprocessResult = {
    processed: number;
    ready: number;
    needsPerson: number;
    errors: number;
};

export type PreprocessPendingRequestsDeps = {
    subscriptionRequestsService: SubscriptionRequestsService;
    personsService: PersonsService;
    personTerminalIdentitiesService: PersonTerminalIdentitiesService;
    personResolver: PersonResolver;
    flags: FeatureFlags;
    idGen: IdGenerator;
    clock: Clock;
};

export type PreprocessPendingRequestsUC = (input: { limit: number }) => Promise<PreprocessResult>;
