import { describe, expect, it } from "vitest";

import { permissionCodes } from "./enum-labels";
import { enCommon } from "./locales/en";
import { kzCommon } from "./locales/kz";
import { ruCommon } from "./locales/ru";

const enLabels = enCommon.permissions.labels as Record<string, unknown>;
const ruLabels = ruCommon.permissions.labels as Record<string, unknown>;
const kzLabels = kzCommon.permissions.labels as Record<string, unknown>;

describe("permission labels", () => {
    it("defines all permission labels in English, Russian, and Kazakh locales", () => {
        for (const permission of permissionCodes) {
            expect(enLabels[permission]).toEqual(expect.any(String));
            expect(ruLabels[permission]).toEqual(expect.any(String));
            expect(kzLabels[permission]).toEqual(expect.any(String));
        }
    });
});
