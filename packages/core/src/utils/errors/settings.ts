import { DomainError } from "./domainError.js";

export class InvalidSettingValueError extends DomainError {
    readonly key: string;

    constructor(key: string, reason: string) {
        super("SETTING_INVALID_VALUE", `Invalid setting ${key}: ${reason}`);
        this.key = key;
    }
}
