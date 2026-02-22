import { describe, expect, it } from "vitest";

import {
    buildSettingsJsonFromDraft,
    createFieldDraft,
    parseDeviceSettingsSchema,
    parseSettingsJsonObject
} from "./device-settings-schema";

describe("device settings schema helpers", () => {
    it("parses nested object and enum fields from JSON schema", () => {
        const schema = parseDeviceSettingsSchema({
            type: "object",
            properties: {
                timePolicy: {
                    type: "object",
                    required: ["mode", "maxDriftMs"],
                    properties: {
                        mode: { type: "string", enum: ["boundedDevice", "device", "adapter"] },
                        maxDriftMs: { type: "integer" }
                    }
                }
            }
        });

        expect(schema).not.toBeNull();
        const timePolicy = schema?.root.properties.find((field) => field.key === "timePolicy");
        expect(timePolicy?.kind).toBe("object");
    });

    it("supports map object + paramsTemplate enum map for identityQueryMappings", () => {
        const schema = parseDeviceSettingsSchema({
            type: "object",
            properties: {
                identityQueryMappings: {
                    type: "object",
                    additionalProperties: {
                        type: "object",
                        required: ["provider", "paramsTemplate"],
                        properties: {
                            provider: { type: "string", const: "dahua.findPerson" },
                            groupIds: { type: "array", items: { type: "string" } },
                            paramsTemplate: {
                                type: "object",
                                propertyNames: { enum: ["person.id", "person.certificatetype"] },
                                additionalProperties: { type: "string" }
                            }
                        }
                    }
                }
            }
        });
        if (!schema) throw new Error("schema parsing failed in test");

        const draft = createFieldDraft(schema, parseSettingsJsonObject('{"identityQueryMappings":{"iin":{"provider":"dahua.findPerson","paramsTemplate":{"person.id":"{{identityValue}}"}}}}'));
        const mappings = draft.identityQueryMappings;
        expect(typeof mappings).toBe("object");

        const built = buildSettingsJsonFromDraft(schema, draft);
        expect(built.fieldErrors).toEqual({});
        expect(built.settingsJson).toContain("identityQueryMappings");
        expect(built.settingsJson).toContain("dahua.findPerson");
    });

    it("does not require optional groupIds and defaults empty paramsTemplate values", () => {
        const schema = parseDeviceSettingsSchema({
            type: "object",
            properties: {
                identityQueryMappings: {
                    type: "object",
                    additionalProperties: {
                        type: "object",
                        required: ["provider", "paramsTemplate"],
                        properties: {
                            provider: { type: "string", const: "dahua.findPerson" },
                            groupIds: { type: "array", minItems: 1, items: { type: "string" } },
                            paramsTemplate: {
                                type: "object",
                                propertyNames: { enum: ["person.id"] },
                                additionalProperties: { type: "string" }
                            }
                        }
                    }
                }
            }
        });
        if (!schema) throw new Error("schema parsing failed in test");

        const built = buildSettingsJsonFromDraft(schema, {
            identityQueryMappings: {
                iin: {
                    provider: "dahua.findPerson",
                    groupIds: [],
                    paramsTemplate: {
                        "person.id": ""
                    }
                }
            }
        });

        expect(built.fieldErrors).toEqual({});
        expect(built.settingsJson).toContain('"paramsTemplate":{"person.id":"{{identityValue}}"}');
        expect(built.settingsJson).not.toContain('"groupIds"');
    });

    it("validates enum and numeric values while building settings json", () => {
        const schema = parseDeviceSettingsSchema({
            type: "object",
            properties: {
                timePolicy: {
                    type: "object",
                    required: ["mode", "maxDriftMs"],
                    properties: {
                        mode: { type: "string", enum: ["boundedDevice", "device", "adapter"] },
                        maxDriftMs: { type: "integer" }
                    }
                }
            }
        });
        if (!schema) throw new Error("schema parsing failed in test");

        const invalid = buildSettingsJsonFromDraft(schema, {
            timePolicy: { mode: "wrong", maxDriftMs: "not-a-number" }
        });
        expect(invalid.settingsJson).toBeNull();
        expect(invalid.fieldErrors).toEqual({
            "timePolicy.mode": "Value is not in allowed enum options.",
            "timePolicy.maxDriftMs": "Value must be numeric."
        });
    });

    it("supports array items enum and validates values against enum options", () => {
        const schema = parseDeviceSettingsSchema({
            type: "object",
            properties: {
                modes: {
                    type: "array",
                    items: {
                        type: "string",
                        enum: ["A", "B", "C"]
                    }
                }
            }
        });
        if (!schema) throw new Error("schema parsing failed in test");

        const modesNode = schema.root.properties.find((node) => node.key === "modes");
        expect(modesNode?.kind).toBe("arrayString");
        if (!modesNode || modesNode.kind !== "arrayString") throw new Error("modes node not parsed");
        expect(modesNode.itemOptions).toEqual(["A", "B", "C"]);

        const valid = buildSettingsJsonFromDraft(schema, { modes: ["A", "C"] });
        expect(valid.fieldErrors).toEqual({});
        expect(valid.settingsJson).toBe('{"modes":["A","C"]}');

        const invalid = buildSettingsJsonFromDraft(schema, { modes: ["A", "X"] });
        expect(invalid.settingsJson).toBeNull();
        expect(invalid.fieldErrors).toEqual({
            modes: 'Value "X" is not in allowed enum options.'
        });
    });
});
