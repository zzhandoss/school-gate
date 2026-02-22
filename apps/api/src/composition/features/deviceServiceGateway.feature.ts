import {
    deviceServiceIdentityFindResultSchema,
    deviceServiceIdentityFindSchema,
    deviceServiceMonitoringSchema,
    getDeviceServiceDeviceResultSchema,
    listDeviceServiceAdaptersResultSchema,
    listDeviceServiceDevicesResultSchema,
    setDeviceServiceDeviceEnabledSchema,
    upsertDeviceServiceDeviceSchema,
    updateDeviceServiceDeviceSchema,
    type GetDeviceServiceDeviceResultDto,
    type DeviceServiceIdentityFindResultDto,
    type ListDeviceServiceAdaptersResultDto,
    type ListDeviceServiceDevicesResultDto
} from "@school-gate/contracts";
import { z } from "zod";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { signAdminJwt } from "../../delivery/http/adminJwt.js";
import { HttpError } from "../../delivery/http/errors/httpError.js";
import type { AdminContext } from "../../delivery/http/middleware/adminAuth.js";
import type { DeviceServiceGatewayModule } from "../../delivery/http/routes/deviceServiceGateway.routes.js";
import type { ApiRuntime } from "../../runtime/createRuntime.js";

type GatewayFeatureConfig = {
    baseUrl: string;
    internalToken: string;
    timeoutMs: number;
    adminJwtSecret: string;
    adminJwtTtlMs: number;
};

type GatewayRequestMeta = {
    authorizationHeader: string | undefined;
    admin: AdminContext | undefined;
};

type FetchUpstreamInput = {
    path: string;
    method: "GET" | "PUT" | "PATCH" | "DELETE" | "POST";
    body?: unknown;
    authMode: "admin" | "internal";
    meta: GatewayRequestMeta;
};

type DeviceServiceMonitoringDto = z.infer<typeof deviceServiceMonitoringSchema>;

const successEnvelopeSchema = z.object({
    success: z.literal(true),
    data: z.unknown()
});

const failureEnvelopeSchema = z.object({
    success: z.literal(false),
    error: z
        .object({
            code: z.string().optional(),
            message: z.string().optional(),
            data: z.unknown().optional()
        })
        .optional()
});

const okResultSchema = z.object({ ok: z.literal(true) });

function normalizeBaseUrl(value: string) {
    return value.replace(/\/$/, "");
}

function toResponseText(response: Response) {
    return response.statusText || `HTTP ${response.status}`;
}

function isAbortError(error: unknown) {
    return error instanceof Error && error.name === "AbortError";
}

function toGenericFailure(status: number, message: string): never {
    const statusCode = (status >= 400 && status < 600 ? status : 502) as ContentfulStatusCode;
    throw new HttpError({
        status: statusCode,
        code: "device_service_gateway_error",
        message
    });
}

function mapUpstreamFailure(response: Response, envelope: z.infer<typeof failureEnvelopeSchema> | null): never {
    if (
        envelope?.error &&
        typeof envelope.error.code === "string" &&
        typeof envelope.error.message === "string"
    ) {
        throw new HttpError({
            status: response.status as ContentfulStatusCode,
            code: envelope.error.code,
            message: envelope.error.message,
            data: envelope.error.data
        });
    }

    toGenericFailure(response.status, `Device-service request failed: ${toResponseText(response)}`);
}

function parseResult<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        throw new HttpError({
            status: 502,
            code: "device_service_invalid_response",
            message: `Invalid device-service response for ${label}`
        });
    }

    return parsed.data;
}

async function parseJsonSafe(response: Response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function resolveAdminAuthorization(config: GatewayFeatureConfig, meta: GatewayRequestMeta) {
    if (meta.authorizationHeader) {
        return meta.authorizationHeader;
    }
    if (!meta.admin) {
        throw new HttpError({ status: 401, code: "unauthorized", message: "Unauthorized" });
    }

    const token = await signAdminJwt({
        secret: config.adminJwtSecret,
        ttlMs: config.adminJwtTtlMs,
        payload: {
            adminId: meta.admin.adminId,
            roleId: meta.admin.roleId,
            permissions: meta.admin.permissions
        }
    });

    return `Bearer ${token}`;
}

async function fetchUpstream(config: GatewayFeatureConfig, input: FetchUpstreamInput): Promise<unknown> {
    const url = `${normalizeBaseUrl(config.baseUrl)}${input.path}`;
    const headers: Record<string, string> = {
        accept: "application/json"
    };

    if (input.authMode === "internal") {
        headers.authorization = `Bearer ${config.internalToken}`;
    } else {
        headers.authorization = await resolveAdminAuthorization(config, input.meta);
    }

    if (input.body !== undefined) {
        headers["content-type"] = "application/json";
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    let response: Response;
    const requestInit: RequestInit = {
        method: input.method,
        headers,
        signal: controller.signal
    };
    if (input.body !== undefined) {
        requestInit.body = JSON.stringify(input.body);
    }

    try {
        response = await fetch(url, requestInit);
    } catch (error) {
        if (isAbortError(error)) {
            throw new HttpError({
                status: 504,
                code: "device_service_timeout",
                message: "Device-service request timed out"
            });
        }
        throw new HttpError({
            status: 502,
            code: "device_service_unavailable",
            message: "Device-service is unavailable"
        });
    } finally {
        clearTimeout(timeout);
    }

    const jsonBody = await parseJsonSafe(response);
    if (!response.ok) {
        const failureParsed = failureEnvelopeSchema.safeParse(jsonBody);
        mapUpstreamFailure(response, failureParsed.success ? failureParsed.data : null);
    }

    const successParsed = successEnvelopeSchema.safeParse(jsonBody);
    if (successParsed.success) {
        return successParsed.data.data;
    }

    throw new HttpError({
        status: 502,
        code: "device_service_invalid_response",
        message: "Device-service returned malformed success payload"
    });
}

function createGatewayModule(config: GatewayFeatureConfig): DeviceServiceGatewayModule {
    return {
        listDevices: async (meta): Promise<ListDeviceServiceDevicesResultDto> => {
            const data = await fetchUpstream(config, { path: "/api/devices", method: "GET", authMode: "admin", meta });
            return parseResult(listDeviceServiceDevicesResultSchema, data, "list_devices");
        },
        getDevice: async ({ deviceId, ...meta }): Promise<GetDeviceServiceDeviceResultDto> => {
            const data = await fetchUpstream(config, { path: `/api/devices/${encodeURIComponent(deviceId)}`, method: "GET", authMode: "admin", meta });
            return parseResult(getDeviceServiceDeviceResultSchema, data, "get_device");
        },
        upsertDevice: async ({ payload, ...meta }) => {
            const requestBody = parseResult(upsertDeviceServiceDeviceSchema, payload, "upsert_device_request");
            const data = await fetchUpstream(config, {
                path: "/api/devices",
                method: "PUT",
                body: requestBody,
                authMode: "admin",
                meta
            });
            return parseResult(okResultSchema, data, "upsert_device");
        },
        updateDevice: async ({ deviceId, payload, ...meta }) => {
            const requestBody = parseResult(updateDeviceServiceDeviceSchema, payload, "update_device_request");
            const data = await fetchUpstream(config, {
                path: `/api/devices/${encodeURIComponent(deviceId)}`,
                method: "PATCH",
                body: requestBody,
                authMode: "admin",
                meta
            });
            return parseResult(okResultSchema, data, "update_device");
        },
        setDeviceEnabled: async ({ deviceId, payload, ...meta }) => {
            const requestBody = parseResult(setDeviceServiceDeviceEnabledSchema, payload, "set_device_enabled_request");
            const data = await fetchUpstream(config, {
                path: `/api/devices/${encodeURIComponent(deviceId)}/enabled`,
                method: "PATCH",
                body: requestBody,
                authMode: "admin",
                meta
            });
            return parseResult(okResultSchema, data, "set_device_enabled");
        },
        deleteDevice: async ({ deviceId, ...meta }) => {
            const data = await fetchUpstream(config, {
                path: `/api/devices/${encodeURIComponent(deviceId)}`,
                method: "DELETE",
                authMode: "admin",
                meta
            });
            return parseResult(okResultSchema, data, "delete_device");
        },
        listAdapters: async (meta): Promise<ListDeviceServiceAdaptersResultDto> => {
            const data = await fetchUpstream(config, { path: "/api/adapters", method: "GET", authMode: "admin", meta });
            return parseResult(listDeviceServiceAdaptersResultSchema, data, "list_adapters");
        },
        getMonitoring: async (meta): Promise<DeviceServiceMonitoringDto> => {
            const data = await fetchUpstream(config, { path: "/internal/monitoring", method: "GET", authMode: "internal", meta });
            return parseResult(deviceServiceMonitoringSchema, data, "monitoring");
        },
        findIdentity: async ({ payload, ...meta }): Promise<DeviceServiceIdentityFindResultDto> => {
            const requestBody = parseResult(deviceServiceIdentityFindSchema, payload, "find_identity_request");
            const data = await fetchUpstream(config, {
                path: "/api/identity/find",
                method: "POST",
                body: {
                    ...requestBody,
                    limit: requestBody.limit ?? 1
                },
                authMode: "internal",
                meta
            });
            return parseResult(deviceServiceIdentityFindResultSchema, data, "find_identity");
        }
    };
}

export function createDeviceServiceGatewayFeatureFromConfig(config: GatewayFeatureConfig): DeviceServiceGatewayModule {
    return createGatewayModule(config);
}

export function createDeviceServiceGatewayFeature(runtime: ApiRuntime): DeviceServiceGatewayModule {
    return createGatewayModule({
        baseUrl: runtime.deviceServiceGatewayCfg.baseUrl,
        internalToken: runtime.deviceServiceGatewayCfg.internalToken,
        timeoutMs: runtime.deviceServiceGatewayCfg.timeoutMs,
        adminJwtSecret: runtime.apiConfig.adminJwtSecret,
        adminJwtTtlMs: runtime.apiConfig.adminJwtTtlMs
    });
}
