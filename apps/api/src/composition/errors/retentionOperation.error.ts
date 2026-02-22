type RetentionOperation = "apply_schedule" | "remove_schedule" | "run_once";

export class RetentionOperationError extends Error {
    readonly operation: RetentionOperation;
    readonly reason: string;

    constructor(message?: string);
    constructor(operation: RetentionOperation, reason: string);
    constructor(operationOrMessage: RetentionOperation | string = "run_once", reason = "unknown") {
        if (reason === "unknown" && operationOrMessage.includes("retention_")) {
            super(operationOrMessage);
            this.name = "RetentionOperationError";
            this.operation = "run_once";
            this.reason = operationOrMessage;
            return;
        }

        const operation = operationOrMessage as RetentionOperation;
        super(`retention_${operation}_failed`);
        this.name = "RetentionOperationError";
        this.operation = operation;
        this.reason = reason;
    }
}
