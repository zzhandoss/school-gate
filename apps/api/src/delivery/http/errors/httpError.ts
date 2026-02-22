import type { ContentfulStatusCode } from "hono/utils/http-status";

export type HttpErrorInput = {
    status: ContentfulStatusCode;
    code: string;
    message: string;
    data?: unknown;
};

export class HttpError extends Error {
    readonly response: HttpErrorInput;

    constructor(response: HttpErrorInput) {
        super(response.message);
        this.name = "HttpError";
        this.response = response;
    }
}

