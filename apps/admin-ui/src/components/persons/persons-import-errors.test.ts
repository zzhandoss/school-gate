import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/types";
import { getPersonsImportErrorMessage } from "./persons-import-errors";
import { getHeaderCheckboxState } from "./persons-import-device-picker";

describe("persons import helpers", () => {
    it("prefers API error message when available", () => {
        const error = new ApiError(503, {
            code: "persons_import_storage_not_initialized",
            message: "Persons import storage is not initialized. Run database migrations."
        });

        expect(getPersonsImportErrorMessage(error, "Sync failed")).toBe(
            "Persons import storage is not initialized. Run database migrations."
        );
    });

    it("returns fallback for unknown errors", () => {
        expect(getPersonsImportErrorMessage(null, "Sync failed")).toBe("Sync failed");
    });

    it("computes header checkbox state for none, partial, and full selection", () => {
        expect(getHeaderCheckboxState(0, 3)).toBe(false);
        expect(getHeaderCheckboxState(2, 3)).toBe("indeterminate");
        expect(getHeaderCheckboxState(3, 3)).toBe(true);
    });
});
