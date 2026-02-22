import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@school-gate/core/auth/permissions";
import { ROLE_PRESETS } from "@school-gate/core/auth/rolePresets";

describe("role presets", () => {
    it("defines unique permissions", () => {
        expect(new Set(PERMISSIONS).size).toBe(PERMISSIONS.length);
    });

    it("uses only known permissions in presets", () => {
        const known = new Set(PERMISSIONS);
        for (const preset of ROLE_PRESETS) {
            for (const perm of preset.permissions) {
                expect(known.has(perm)).toBe(true);
            }
        }
    });

    it("includes a super_admin preset with all permissions", () => {
        const preset = ROLE_PRESETS.find((entry) => entry.name === "super_admin");
        expect(preset).toBeTruthy();
        expect(new Set(preset?.permissions ?? [])).toEqual(new Set(PERMISSIONS));
    });
});

