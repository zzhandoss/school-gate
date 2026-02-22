import { ZodError } from "zod";
import type { RouteErrorMapping } from "../context.js";
import type { HttpErrorInput } from "./httpError.js";
import { HttpError } from "./httpError.js";
import { domainErrorRegistry } from "./registry/domainErrorRegistry.js";

function resolveMapping(error: unknown, mapping: readonly RouteErrorMapping[]): HttpErrorInput | null {
    const matched = mapping.find((entry) => error instanceof entry.error);
    if (!matched) {
        return null;
    }

    return typeof matched.response === "function"
        ? matched.response(error)
        : matched.response;
}

export function mapErrorToFailure(error: unknown, overrides?: readonly RouteErrorMapping[]): HttpErrorInput | null {
    if (error instanceof HttpError) {
        return error.response;
    }

    const overrideMapped = resolveMapping(error, overrides ?? []);
    if (overrideMapped) {
        return overrideMapped;
    }

    const registryMapped = resolveMapping(error, domainErrorRegistry);
    if (registryMapped) {
        return registryMapped;
    }

    if (error instanceof ZodError) {
        return {
            status: 500,
            code: "internal_error",
            message: "Internal validation error"
        };
    }

    return null;
}
