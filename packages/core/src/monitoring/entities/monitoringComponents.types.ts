import type { ComponentHealthStatus } from "./monitoringStatus.types.js";

export type ComponentHealth = {
    componentId: string;
    status: ComponentHealthStatus;
    checkedAt: Date;
    responseTimeMs: number | null;
    error: string | null;
};
