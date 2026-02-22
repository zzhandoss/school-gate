type RecordLike = Record<string, unknown>;

export function asRecord(value: unknown, name: string): RecordLike {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${name} must be an object`);
    }
    return value as RecordLike;
}

export function asOptionalString(value: unknown, name: string): string | undefined {
    if (value === undefined) return undefined;
    if (value === null) return undefined;
    if (typeof value === "string" && value.trim().length > 0) return value;
    throw new Error(`${name} must be a non-empty string`);
}

export function asPositiveInt(value: unknown, name: string): number {
    if (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
        return value;
    }
    throw new Error(`${name} must be a positive integer`);
}

export function asOptionalPositiveInt(value: unknown, name: string): number | undefined {
    if (value === undefined || value === null) return undefined;
    return asPositiveInt(value, name);
}

export function asEnum<T extends string>(value: unknown, name: string, allowed: readonly T[]): T {
    if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
        return value as T;
    }
    throw new Error(`${name} must be one of: ${allowed.join(", ")}`);
}
