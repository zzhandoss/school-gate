import {
    applyRetentionScheduleResultSchema,
    removeRetentionScheduleResultSchema,
    runRetentionOnceResultSchema,
    type ApplyRetentionScheduleResultDto,
    type RemoveRetentionScheduleResultDto,
    type RunRetentionOnceResultDto
} from "@school-gate/contracts";
import {
    applyRetentionSchedule,
    removeRetentionSchedule,
    runRetentionOnce,
    type ApplyRetentionScheduleResult,
    type RemoveRetentionScheduleResult,
    type RunRetentionOnceResult
} from "@school-gate/infra";
import type { RetentionModule } from "../../delivery/http/routes/retention.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";
import { RetentionOperationError } from "../errors/retentionOperation.error.js";

function mapApplyResult(result: ApplyRetentionScheduleResult): ApplyRetentionScheduleResultDto {
    return applyRetentionScheduleResultSchema.parse(result);
}

function mapRemoveResult(result: RemoveRetentionScheduleResult): RemoveRetentionScheduleResultDto {
    return removeRetentionScheduleResultSchema.parse(result);
}

function mapRunOnceResult(result: RunRetentionOnceResult): RunRetentionOnceResultDto {
    return runRetentionOnceResultSchema.parse({
        ...result,
        accessEventsCutoff: result.accessEventsCutoff.toISOString(),
        auditLogsCutoff: result.auditLogsCutoff.toISOString()
    });
}

function toReason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function createRetentionFeature(runtime: ApiRuntime): RetentionModule {
    return {
        applySchedule: async () => {
            try {
                const result = await applyRetentionSchedule(runtime.dbClient.db, {
                    cwd: runtime.envInfo.baseDir,
                    platform: process.platform,
                    clock: runtime.clock
                });
                return mapApplyResult(result);
            } catch (error) {
                throw new RetentionOperationError("apply_schedule", toReason(error));
            }
        },
        removeSchedule: async () => {
            try {
                const result = await removeRetentionSchedule(runtime.dbClient.db, {
                    platform: process.platform,
                    clock: runtime.clock
                });
                return mapRemoveResult(result);
            } catch (error) {
                throw new RetentionOperationError("remove_schedule", toReason(error));
            }
        },
        runOnce: async () => {
            try {
                const result = await runRetentionOnce(runtime.dbClient.db, runtime.clock);
                return mapRunOnceResult(result);
            } catch (error) {
                throw new RetentionOperationError("run_once", toReason(error));
            }
        }
    };
}
