import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));

export default defineConfig({
    resolve: {
        alias: [
            {
                find: "@school-gate/config",
                replacement: resolve(rootDir, "packages/config/src/index.ts"),
            },
            {
                find: "@school-gate/contracts",
                replacement: resolve(rootDir, "packages/contracts/src/index.ts"),
            },
            {
                find: "@school-gate/core",
                replacement: resolve(rootDir, "packages/core/src"),
            },
            {
                find: "@school-gate/infra",
                replacement: resolve(rootDir, "packages/infra/src"),
            },
            {
                find: "@school-gate/db",
                replacement: resolve(rootDir, "packages/db/src"),
            },
            {
                find: "@school-gate/device/core",
                replacement: resolve(rootDir, "packages/device/core/src"),
            },
            {
                find: "@school-gate/device/infra",
                replacement: resolve(rootDir, "packages/device/infra/src"),
            },
            {
                find: "@school-gate/device/device-db",
                replacement: resolve(rootDir, "packages/device/device-db/src"),
            },
        ],
    },
    test: {
        environment: "node",
        globals: true
    }
});
