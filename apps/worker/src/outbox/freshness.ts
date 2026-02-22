export function parseIsoOrThrow(value: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid timestamp: ${value}`);
    }
    return parsed;
}

export function computeAgeMs(input: { now: Date; sourceTime: Date }): number {
    return input.now.getTime() - input.sourceTime.getTime();
}

export function isStaleByAge(input: { ageMs: number; maxAgeMs: number | undefined }): boolean {
    if (input.maxAgeMs === undefined) {
        return false;
    }
    return input.ageMs > input.maxAgeMs;
}

