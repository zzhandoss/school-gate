export class HttpError extends Error {
    readonly status: number;
    readonly code: string;
    readonly data?: unknown;

    constructor(input: { status: number; code: string; message: string; data?: unknown }) {
        super(input.message);
        this.name = "HttpError";
        this.status = input.status;
        this.code = input.code;
        this.data = input.data;
    }
}

export function unauthorizedError() {
    return new HttpError({ status: 401, code: "unauthorized", message: "Unauthorized" });
}

export function forbiddenError() {
    return new HttpError({ status: 403, code: "forbidden", message: "Forbidden" });
}

export function notFoundError(code: string, message: string) {
    return new HttpError({ status: 404, code, message });
}

export function conflictError(code: string, message: string) {
    return new HttpError({ status: 409, code, message });
}
