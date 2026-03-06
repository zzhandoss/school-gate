import { describe, expect, it } from "vitest";

import {
    getSelectedVisiblePersonIds,
    toggleAllVisiblePersons,
    toggleSelectedPerson
} from "./persons-selection";

describe("persons selection helpers", () => {
    it("toggles a single person in selection map", () => {
        expect(toggleSelectedPerson({}, "p1", true)).toEqual({ p1: true });
        expect(toggleSelectedPerson({ p1: true, p2: true }, "p1", false)).toEqual({ p2: true });
    });

    it("toggles current visible page only", () => {
        expect(toggleAllVisiblePersons(["p1", "p2"], true)).toEqual({ p1: true, p2: true });
        expect(toggleAllVisiblePersons(["p1", "p2"], false)).toEqual({});
    });

    it("returns only selected visible ids", () => {
        expect(getSelectedVisiblePersonIds(["p1", "p3"], { p1: true, p2: true })).toEqual(["p1"]);
    });
});
