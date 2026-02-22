import { Config } from "drizzle-kit";
import path from "node:path";

function normalizeSqliteUrl(url: string): string {
    return url.startsWith("file:") ? url.slice("file:".length) : url;
}

const databaseUrlRaw = process.env.DEVICE_DATABASE_URL ?? process.env.DEVICE_DB_FILE ?? "file:./data/device.db";
const databaseUrl = path.resolve(process.cwd(), normalizeSqliteUrl(databaseUrlRaw));

export default {
    schema: "./packages/device/dist/device-db/src/schema/index.js",
    out: "./packages/device/device-db/src/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: databaseUrl
    }
} satisfies Config;
