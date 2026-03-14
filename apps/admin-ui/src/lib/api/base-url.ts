const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

type ResolveApiBaseUrlInput = {
    apiBaseUrl: string
    forwardedHost?: string | null
    forwardedProto?: string | null
    host?: string | null
    origin?: string | null
};

function normalizeBaseUrl(baseUrl: string) {
    return baseUrl.trim().replace(/\/+$/, "");
}

function normalizePath(path: string) {
    if (!path) {
        return "/";
    }
    return path.startsWith("/") ? path : `/${path}`;
}

function normalizeBasePath(basePath: string) {
    if (basePath === "/") {
        return "";
    }
    return basePath.replace(/\/+$/, "");
}

function pickHeaderValue(value?: string | null) {
    const normalized = value?.split(",")[0]?.trim();
    return normalized ? normalized : null;
}

function joinApiPath(basePath: string, path: string) {
    const normalizedBasePath = normalizeBasePath(basePath);
    const normalizedPath = normalizePath(path);
    if (!normalizedBasePath) {
        return normalizedPath;
    }
    if (normalizedPath === normalizedBasePath || normalizedPath.startsWith(`${normalizedBasePath}/`)) {
        return normalizedPath;
    }
    return `${normalizedBasePath}${normalizedPath}`;
}

export function requireApiBaseUrl(baseUrl?: string | null) {
    const normalized = baseUrl?.trim();
    if (!normalized) {
        throw new Error("Missing VITE_API_BASE_URL. Configure API base URL explicitly.");
    }
    return normalizeBaseUrl(normalized);
}

export function buildApiUrl(path: string, baseUrl: string) {
    if (ABSOLUTE_URL_PATTERN.test(path)) {
        return path;
    }

    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    if (ABSOLUTE_URL_PATTERN.test(normalizedBaseUrl)) {
        const base = new URL(normalizedBaseUrl);
        const joinedPath = joinApiPath(base.pathname, path);
        return `${base.origin}${joinedPath}`;
    }

    return joinApiPath(normalizedBaseUrl, path);
}

export function resolveApiBaseUrlFromRequest(input: ResolveApiBaseUrlInput) {
    const baseUrl = requireApiBaseUrl(input.apiBaseUrl);
    if (ABSOLUTE_URL_PATTERN.test(baseUrl)) {
        return baseUrl;
    }

    const origin = input.origin?.trim();
    if (origin && ABSOLUTE_URL_PATTERN.test(origin)) {
        return `${normalizeBaseUrl(origin)}${baseUrl}`;
    }

    const host = pickHeaderValue(input.forwardedHost) ?? pickHeaderValue(input.host);
    if (!host) {
        throw new Error("Cannot resolve API origin from request headers for relative VITE_API_BASE_URL.");
    }

    const protocol = pickHeaderValue(input.forwardedProto) ?? "http";
    return `${protocol}://${host}${baseUrl}`;
}
