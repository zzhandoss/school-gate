import type { MonitoringSnapshot, PendingRequestItem } from "./types";
import { requestApi } from "@/lib/api/client";


type MonitoringResponse = MonitoringSnapshot;

type RequestsResponse = {
    requests: Array<PendingRequestItem>
};

export async function getMonitoringSnapshot() {
    return requestApi<MonitoringResponse>("/api/monitoring");
}

export async function getPendingRequests(limit = 8) {
    const query = new URLSearchParams({
        limit: String(limit),
        order: "newest",
        only: "all"
    });
    const response = await requestApi<RequestsResponse>(
        `/api/subscription-requests?${query.toString()}`
    );
    return response.requests;
}
