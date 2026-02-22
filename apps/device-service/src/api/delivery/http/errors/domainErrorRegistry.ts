import type { ApiError } from "../response.js";

const namedErrors = new Map<string, ApiError>([
    ["DeviceNotFoundError", { status: 404, code: "device_not_found", message: "Device was not found" }],
    ["AdapterNotFoundError", { status: 404, code: "adapter_not_found", message: "Adapter not found" }]
]);

export function mapDomainErrorToFailure(err: Error): ApiError | undefined {
    return namedErrors.get(err.name);
}
