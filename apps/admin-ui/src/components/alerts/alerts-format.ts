import type { AlertEvent, AlertRule } from "@/lib/alerts/types";
import { formatDateTime } from "@/lib/i18n/format";

export function formatAlertDate(value: string) {
    return formatDateTime(value, "-");
}

export function severityBadgeClass(
    severity: AlertRule["severity"] | AlertEvent["severity"]
) {
    return severity === "critical"
        ? "border-red-300 bg-red-50 text-red-800"
        : "border-amber-300 bg-amber-50 text-amber-800";
}

export function statusBadgeClass(status: AlertEvent["status"]) {
    return status === "triggered"
        ? "border-red-300 bg-red-50 text-red-800"
        : "border-emerald-300 bg-emerald-50 text-emerald-800";
}
