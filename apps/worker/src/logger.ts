import path from "node:path";

import { getLoggingConfig } from "@school-gate/config";
import { createFileLogger } from "@school-gate/infra";

export function createWorkerLogger(name: string) {
    const loggingConfig = getLoggingConfig();
    return createFileLogger({
        name,
        level: loggingConfig.level,
        filePath: path.join(loggingConfig.dir, `${name}.log`),
        maxBytes: loggingConfig.maxBytes,
        retentionDays: loggingConfig.retentionDays,
    });
}
