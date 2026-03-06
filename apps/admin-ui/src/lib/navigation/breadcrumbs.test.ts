import { beforeEach, describe, expect, it } from "vitest";

import { buildBreadcrumbs } from "./breadcrumbs";
import { i18n } from "@/lib/i18n";

describe("buildBreadcrumbs", () => {
    beforeEach(async () => {
        await i18n.changeLanguage("en");
    });

    it("returns persons import breadcrumb chain for import route", () => {
        expect(buildBreadcrumbs("/persons/import", ["persons.read"])).toEqual([
            { label: "Persons", to: "/persons" },
            { label: "Import" }
        ]);
    });

    it("returns profile breadcrumb for profile route", () => {
        expect(buildBreadcrumbs("/profile", [])).toEqual([{ label: "Profile" }]);
    });
});
