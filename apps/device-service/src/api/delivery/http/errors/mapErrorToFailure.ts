import { ZodError } from "zod";
import type { ApiError } from "../response.js";
import { HttpError } from "./httpError.js";
import { mapDomainErrorToFailure } from "./domainErrorRegistry.js";

export function mapErrorToFailure(err: unknown): ApiError | undefined {
    if (err instanceof HttpError) {
        return {
            status: err.status,
            code: err.code,
            message: err.message,
            data: err.data,
        };
    }

    if (err instanceof ZodError) {
        return {
            status: 400,
            code: "validation_error",
            message: "Request validation failed",
            data: { issues: err.issues },
        };
    }

    if (err instanceof Error) {
        return mapDomainErrorToFailure(err);
    }

    return undefined;
}
