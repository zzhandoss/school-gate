export class DomainError extends Error {
    readonly code: string;

    constructor(code: string, message?: string) {
        super(message ?? code);
        this.code = code;
    }
}
