export class CurrentPasswordInvalidError extends Error {
    constructor() {
        super("Current password is invalid");
        this.name = "CurrentPasswordInvalidError";
    }
}
