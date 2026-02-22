import type { AuditLogEntry } from "../audit/index.js";

export interface Auditor {
    write(entry: AuditLogEntry): Promise<void>;
}
