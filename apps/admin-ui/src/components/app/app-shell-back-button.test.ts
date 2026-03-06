import { describe, expect, it } from "vitest";

import { getAppShellBackFallback } from "./app-shell-back-button";

describe("getAppShellBackFallback", () => {
    it("returns persons list fallback for person details page", () => {
        expect(getAppShellBackFallback("/persons/123")).toEqual({
            to: "/persons",
            search: {
                limit: 20,
                offset: 0,
                iin: "",
                query: "",
                linkedStatus: "all",
                includeDeviceIds: "",
                excludeDeviceIds: ""
            }
        });
    });

    it("returns persons list fallback for persons import page", () => {
        expect(getAppShellBackFallback("/persons/import")).toEqual({
            to: "/persons",
            search: {
                limit: 20,
                offset: 0,
                iin: "",
                query: "",
                linkedStatus: "all",
                includeDeviceIds: "",
                excludeDeviceIds: ""
            }
        });
    });

    it("does not return fallback for top-level pages", () => {
        expect(getAppShellBackFallback("/persons")).toBeNull();
        expect(getAppShellBackFallback("/dashboard")).toBeNull();
    });
});
