import { z } from "zod";
import { parseEnv } from "./parseEnv.js";

const coreDatabaseSchema = z.object({
    DATABASE_URL: z.string().min(1).default("file:./data/app.db")
});

const deviceDatabaseSchema = z.object({
    DEVICE_DATABASE_URL: z.string().min(1).default("file:./data/device.db")
});

export function getCoreDatabaseUrl(): string {
    return parseEnv(coreDatabaseSchema, "drizzle core db").DATABASE_URL;
}

export function getDeviceDatabaseUrl(): string {
    return parseEnv(deviceDatabaseSchema, "drizzle device db").DEVICE_DATABASE_URL;
}

