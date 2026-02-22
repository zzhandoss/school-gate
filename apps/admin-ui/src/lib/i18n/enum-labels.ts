import type { TFunction } from "i18next";

import type { AccessEventStatus } from "@/lib/access-events/types";
import type {
    SubscriptionRequestResolutionStatus,
    SubscriptionRequestStatus
} from "@/lib/subscription-requests/types";

export function accessEventStatusLabel(
    t: TFunction,
    value: "all" | AccessEventStatus
) {
    return t(`enums.accessEventStatus.${value}`);
}

export function directionLabel(t: TFunction, value: "all" | "IN" | "OUT") {
    return t(`enums.direction.${value}`);
}

export function monitoringStatusLabel(t: TFunction, value: "all" | "ok" | "stale") {
    return t(`enums.monitoringStatus.${value}`);
}

export function subscriptionStatusLabel(
    t: TFunction,
    value: "all" | SubscriptionRequestStatus | "not_pending"
) {
    return t(`enums.subscriptionStatus.${value}`);
}

export function subscriptionResolutionLabel(
    t: TFunction,
    value: "all" | SubscriptionRequestResolutionStatus | "new"
) {
    return t(`enums.subscriptionResolution.${value}`);
}

export function orderLabel(t: TFunction, value: "newest" | "oldest") {
    return t(`enums.order.${value}`);
}
