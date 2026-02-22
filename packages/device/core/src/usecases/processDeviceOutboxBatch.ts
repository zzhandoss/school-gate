import { DeviceDomainEvents } from "../events/domain.js";
import type { CoreAccessEventIngestInput, CoreIngestClient } from "../ports/coreIngestClient.js";
import type { DeviceCursorsRepo } from "../repos/deviceCursors.repo.js";
import type { DeviceOutboxRepo, DeviceOutboxRecord } from "../repos/deviceOutbox.repo.js";

export type ProcessDeviceOutboxBatchInput = {
    limit: number;
    maxAttempts: number;
    leaseMs: number;
    processingBy: string;
    now: () => Date;
};

export type ProcessDeviceOutboxBatchResult = {
    claimed: number;
    processed: number;
    failed: number;
};

type RetriableError = Error & { retriable?: boolean };

function parseAccessEventPayload(record: DeviceOutboxRecord): CoreAccessEventIngestInput {
    const payload = JSON.parse(record.payloadJson) as CoreAccessEventIngestInput;
    if (!payload.eventId || !payload.deviceId || !payload.direction) {
        throw new Error("Invalid access_event.ingest payload");
    }
    return payload;
}

function isPermanentHttpError(err: RetriableError): boolean {
    const status = (err as { status?: number }).status;
    if (typeof status !== "number") return false;
    if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return true;
    }
    return false;
}

function effectiveMaxAttempts(err: RetriableError, maxAttempts: number): number {
    if (err.retriable === false) return 1;
    if (isPermanentHttpError(err)) return 1;
    return maxAttempts;
}

export function createProcessDeviceOutboxBatchUC(deps: {
    deviceOutboxRepo: DeviceOutboxRepo;
    coreIngestClient: CoreIngestClient;
    deviceCursorsRepo: DeviceCursorsRepo;
}) {
    return async function processDeviceOutboxBatch(
        input: ProcessDeviceOutboxBatchInput
    ): Promise<ProcessDeviceOutboxBatchResult> {
        const claimed = deps.deviceOutboxRepo.claimBatch({
            limit: input.limit,
            now: input.now(),
            leaseMs: input.leaseMs,
            processingBy: input.processingBy
        });

        let processed = 0;
        let failed = 0;

        for (const record of claimed) {
            if (record.type !== DeviceDomainEvents.ACCESS_EVENT_INGEST) {
                deps.deviceOutboxRepo.markFailed({
                    id: record.id,
                    error: `Unknown device outbox event type: ${record.type}`,
                    maxAttempts: input.maxAttempts
                });
                failed++;
                continue;
            }

            try {
                const payload = parseAccessEventPayload(record);
                const result = await deps.coreIngestClient.sendEvent(payload);
                const processedAt = input.now();
                deps.deviceOutboxRepo.markProcessed({ id: record.id, processedAt });
                if (result.result === "inserted" || result.result === "duplicate") {
                    deps.deviceCursorsRepo.upsertIfNewer({
                        deviceId: payload.deviceId,
                        eventId: payload.eventId,
                        occurredAt: new Date(payload.occurredAt),
                        updatedAt: processedAt
                    });
                }
                processed++;
            } catch (err: any) {
                const error = err as RetriableError;
                deps.deviceOutboxRepo.markFailed({
                    id: record.id,
                    error: String(error?.message ?? error),
                    maxAttempts: effectiveMaxAttempts(error, input.maxAttempts)
                });
                failed++;
            }
        }

        return {
            claimed: claimed.length,
            processed,
            failed
        };
    };
}
