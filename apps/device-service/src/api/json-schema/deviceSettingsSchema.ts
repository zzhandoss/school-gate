import * as Ajv2020Module from "ajv/dist/2020.js";
import type { ErrorObject } from "ajv";
import * as addFormatsModule from "ajv-formats";
import { HttpError } from "../delivery/http/errors/httpError.js";

type JsonObject = Record<string, unknown>;

const Ajv2020 = (Ajv2020Module as unknown as { default: new (...args: any[]) => any }).default;
const addFormats = (addFormatsModule as unknown as { default: (ajv: any) => void }).default;

const ajv = new Ajv2020({
    allErrors: true,
    strict: false,
    validateSchema: true,
});
addFormats(ajv);

function isRecord(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toValidationMessage(errors: ErrorObject[] | null | undefined, fallback: string): string {
    const first = errors?.[0];
    if (!first) return fallback;
    const path = first.instancePath?.trim() ? first.instancePath : "/";
    const detail = first.message ?? "is invalid";
    return `${path} ${detail}`;
}

export function ensureDeviceSettingsSchema(schema: unknown): JsonObject {
    if (!isRecord(schema)) {
        throw new HttpError({
            status: 400,
            code: "invalid_device_settings_schema",
            message: "deviceSettingsSchema must be an object",
        });
    }

    const valid = ajv.validateSchema(schema);
    if (!valid) {
        throw new HttpError({
            status: 400,
            code: "invalid_device_settings_schema",
            message: `deviceSettingsSchema is not a valid JSON Schema draft 2020-12: ${toValidationMessage(
                ajv.errors,
                "schema is invalid"
            )}`,
        });
    }

    return schema;
}

function parseSettingsJson(settingsJson: string | null | undefined): unknown {
    if (settingsJson === null || settingsJson === undefined) {
        return null;
    }

    try {
        return JSON.parse(settingsJson);
    } catch {
        throw new HttpError({
            status: 400,
            code: "invalid_device_settings",
            message: "settingsJson must be valid JSON",
        });
    }
}

export function ensureDeviceSettingsMatchSchema(input: {
    schema: JsonObject;
    settingsJson: string | null | undefined;
}) {
    const validate = ajv.compile(input.schema);
    const parsedSettings = parseSettingsJson(input.settingsJson);
    const valid = validate(parsedSettings);
    if (!valid) {
        throw new HttpError({
            status: 400,
            code: "invalid_device_settings",
            message: `settingsJson does not match adapter schema: ${toValidationMessage(
                validate.errors,
                "value is invalid"
            )}`,
        });
    }
}
