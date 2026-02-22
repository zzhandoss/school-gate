import path from "node:path";

import { getLoggingConfig } from "@school-gate/config";
import { createFileLogger, createLogger } from "@school-gate/infra";

export function createDeviceServiceLogger(name: string) {
    const loggingConfig = getLoggingConfig();
    const nodeEnv = process.env["NODE_ENV"];
    if (nodeEnv === "development" || nodeEnv === "dev") {
        return createLogger({
            name,
            level: loggingConfig.level,
        });
    }

    return createFileLogger({
        name,
        level: loggingConfig.level,
        filePath: path.join(loggingConfig.dir, `${name}.log`),
        maxBytes: loggingConfig.maxBytes,
        retentionDays: loggingConfig.retentionDays,
    });
}
