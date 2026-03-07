function parseSettingsJson(settingsJson: string | null | undefined): Record<string, unknown> | null {
    if (!settingsJson) {
        return null;
    }

    try {
        const parsed = JSON.parse(settingsJson);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return null;
        }

        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function resolveTerminalSyncMappedUserId(input: {
    settingsJson: string | null | undefined;
    personIin: string;
}): string | null {
    const settings = parseSettingsJson(input.settingsJson);
    if (!settings) {
        return null;
    }

    const mappings = settings.identityQueryMappings;
    if (!mappings || typeof mappings !== "object" || Array.isArray(mappings)) {
        return null;
    }

    const iinMapping = (mappings as Record<string, unknown>)["iin"];
    if (!iinMapping || typeof iinMapping !== "object" || Array.isArray(iinMapping)) {
        return null;
    }

    const paramsTemplate = (iinMapping as Record<string, unknown>)["paramsTemplate"];
    if (!paramsTemplate || typeof paramsTemplate !== "object" || Array.isArray(paramsTemplate)) {
        return null;
    }

    return Object.values(paramsTemplate as Record<string, unknown>).some((value) => value === "{{identityValue}}")
        ? input.personIin
        : null;
}
