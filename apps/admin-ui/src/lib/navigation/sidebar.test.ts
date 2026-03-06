import { describe, expect, it } from "vitest";

import { buildSidebarNavigation } from "./sidebar";

function findItem(pathname: string, permissions: Array<string>, itemId: string) {
    return buildSidebarNavigation({ pathname, permissions })
        .flatMap((group) => group.items)
        .find((item) => item.id === itemId);
}

describe("buildSidebarNavigation", () => {
    it("shows monitoring page link with monitoring.read permission", () => {
        const item = findItem("/monitoring", ["monitoring.read"], "monitoring-overview");

        expect(item?.to).toBe("/monitoring");
        expect(item?.isActive("/monitoring")).toBe(true);
    });

    it("hides monitoring page link without monitoring.read permission", () => {
        const item = findItem("/dashboard", [], "monitoring-overview");
        expect(item).toBeUndefined();
    });
});
