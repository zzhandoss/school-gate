import { enqueueAuditRequested } from "../../audit/events/auditRequested.js";
import type { CleanupRetentionAudit, CleanupRetentionInput, CleanupRetentionResult } from "./cleanupRetention.types.js";
import type { AccessEventsRetentionService } from "../services/accessEventsRetention.types.js";
import type { AuditLogsRetentionService } from "../services/auditLogsRetention.types.js";

type CleanupCutoffs = {
    accessEvents: Date;
    auditLogs: Date;
};

type CleanupStepContext = {
    input: CleanupRetentionInput;
    cutoffs: CleanupCutoffs;
};

type CleanupStepResult = Partial<CleanupRetentionResult>;

type CleanupStep = (ctx: CleanupStepContext) => Promise<CleanupStepResult>;

type CleanupRetentionFlowDeps = {
    accessEventsRetentionService: AccessEventsRetentionService;
    auditLogsRetentionService: AuditLogsRetentionService;
    audit?: CleanupRetentionAudit | undefined;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysToCutoff(now: Date, days: number): Date {
    return new Date(now.getTime() - days * MS_PER_DAY);
}

function buildCutoffs(input: CleanupRetentionInput): CleanupCutoffs {
    return {
        accessEvents: daysToCutoff(input.now, input.accessEventsDays),
        auditLogs: daysToCutoff(input.now, input.auditLogsDays),
    };
}

function buildInitialResult(input: CleanupRetentionInput, cutoffs: CleanupCutoffs): CleanupRetentionResult {
    return {
        accessEventsDeleted: 0,
        auditLogsDeleted: 0,
        accessEventsCutoff: cutoffs.accessEvents,
        auditLogsCutoff: cutoffs.auditLogs,
    };
}

function applyResultPatch(target: CleanupRetentionResult, patch: CleanupStepResult) {
    if (patch.accessEventsDeleted !== undefined) {
        target.accessEventsDeleted = patch.accessEventsDeleted;
    }
    if (patch.auditLogsDeleted !== undefined) {
        target.auditLogsDeleted = patch.auditLogsDeleted;
    }
    if (patch.accessEventsCutoff !== undefined) {
        target.accessEventsCutoff = patch.accessEventsCutoff;
    }
    if (patch.auditLogsCutoff !== undefined) {
        target.auditLogsCutoff = patch.auditLogsCutoff;
    }
}

function buildAccessEventsStep(service: AccessEventsRetentionService): CleanupStep {
    return async ({ input, cutoffs }) => {
        const accessEventsDeleted = await service.deleteTerminalBefore({
            cutoff: cutoffs.accessEvents,
            limit: input.batch,
        });
        return { accessEventsDeleted };
    };
}

function buildAuditLogsStep(service: AuditLogsRetentionService): CleanupStep {
    return async ({ input, cutoffs }) => {
        const auditLogsDeleted = await service.deleteBefore({
            cutoff: cutoffs.auditLogs,
            limit: input.batch,
        });
        return { auditLogsDeleted };
    };
}

export function createCleanupRetentionFlow(deps: CleanupRetentionFlowDeps) {
    const steps: CleanupStep[] = [
        buildAccessEventsStep(deps.accessEventsRetentionService),
        buildAuditLogsStep(deps.auditLogsRetentionService),
    ];

    return async function cleanupRetention(
        input: CleanupRetentionInput
    ): Promise<CleanupRetentionResult> {
        const cutoffs = buildCutoffs(input);
        const ctx: CleanupStepContext = { input, cutoffs };
        const result = buildInitialResult(input, cutoffs);

        for (const step of steps) {
            const patch = await step(ctx);
            applyResultPatch(result, patch);
        }

        if (deps.audit) {
            enqueueAuditRequested({
                outbox: deps.audit.outbox,
                id: deps.audit.idGen.nextId(),
                actorId: deps.audit.actorId ?? "system:retention_worker",
                action: "retention_cleanup_completed",
                entityType: "retention_job",
                entityId: "core_retention",
                at: input.now,
                meta: {
                    accessEventsDeleted: result.accessEventsDeleted,
                    auditLogsDeleted: result.auditLogsDeleted,
                    accessEventsCutoff: result.accessEventsCutoff.toISOString(),
                    auditLogsCutoff: result.auditLogsCutoff.toISOString(),
                },
            });
        }

        return result;
    };
}