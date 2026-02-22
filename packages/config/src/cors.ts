const DEFAULT_CORS_ORIGIN = "http://localhost:3000,http://localhost:5000";

export function parseCorsAllowedOrigins(raw: string, envKey: string): string[] {
    const origins = raw
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

    if (origins.length === 0) {
        throw new Error(`Invalid config: ${envKey} must include at least one origin`);
    }

    return origins;
}

export { DEFAULT_CORS_ORIGIN };
