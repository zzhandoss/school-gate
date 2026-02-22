const linkCommandPattern = /^\/link(?:@[\w_]+)?(?:\s+(.+))?$/i;

export function parseLinkCodeCommand(text: string): string | null {
    const normalized = text.trim();
    const match = linkCommandPattern.exec(normalized);
    if (!match) return null;

    const payload = (match[1] ?? "").trim();
    if (payload.length === 0) return "";
    return payload.split(/\s+/)[0] ?? "";
}
