import "dotenv/config";
import { Config } from "drizzle-kit";
import path from "node:path";

function normalizeSqliteUrl(url: string): string {
    return url.startsWith("file:") ? url.slice("file:".length) : url;
}

const databaseUrlRaw = process.env.DATABASE_URL ?? process.env.DB_FILE ?? "file:./data/app.db";
const databaseUrl = path.resolve(process.cwd(), normalizeSqliteUrl(databaseUrlRaw));

export default {
    schema: "./packages/db/dist/schema/index.js",
    out: "./packages/db/src/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: databaseUrl
    }
} satisfies Config;
