const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

type ResolveApiBaseUrlInput = {
    apiBaseUrl?: string | null
    forwardedHost?: string | null
    forwardedProto?: string | null
    host?: string | null
    origin?: string | null
};

function normalizeBaseUrl(baseUrl: string) {
    return baseUrl.replace(/\/+$/, "");
}

function normalizePath(path: string) {
    if (!path) {
        return "/";
    }
    return path.startsWith("/") ? path : `/${path}`;
}

function pickHeaderValue(value?: string | null) {
    const normalized = value?.split(",")[0]?.trim();
    return normalized ? normalized : null;
}

export function buildApiUrl(path: string, baseUrl?: string | null) {
    if (ABSOLUTE_URL_PATTERN.test(path)) {
        return path;
    }

    const normalizedPath = normalizePath(path);
    if (!baseUrl) {
        return normalizedPath;
    }

    return `${normalizeBaseUrl(baseUrl)}${normalizedPath}`;
}

export function resolveApiBaseUrlFromRequest(input: ResolveApiBaseUrlInput) {
    const envBaseUrl = input.apiBaseUrl?.trim();
    if (envBaseUrl) {
        return normalizeBaseUrl(envBaseUrl);
    }

    const origin = input.origin?.trim();
    if (origin) {
        return normalizeBaseUrl(origin);
    }

    const host = pickHeaderValue(input.forwardedHost) ?? pickHeaderValue(input.host);
    if (!host) {
        return null;
    }

    const protocol = pickHeaderValue(input.forwardedProto) ?? "http";
    return `${protocol}://${host}`;
}
