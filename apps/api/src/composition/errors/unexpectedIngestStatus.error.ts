export class UnexpectedIngestStatusError extends Error {
    constructor(status = "unknown") {
        super(`unexpected_ingest_status:${status}`);
        this.name = "UnexpectedIngestStatusError";
    }
}
