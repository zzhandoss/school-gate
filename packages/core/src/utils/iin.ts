export function normalizeIin(iin: string): string {
    return iin.trim();
}

export function isValidIin(iin: string): boolean {
    return /^\d{12}$/.test(iin);
}
