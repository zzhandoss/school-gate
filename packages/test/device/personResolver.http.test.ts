import { describe, expect, it } from "vitest";
import { createDeviceServicePersonResolver } from "@school-gate/device/infra/http/personResolver";

describe("DeviceServicePersonResolver HTTP", () => {
    it("returns found mappings when DS returns matches", async () => {
        const resolver = createDeviceServicePersonResolver({
            baseUrl: "http://localhost:4010",
            token: "token",
            fetchImpl: async () =>
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            identityKey: "iin",
                            identityValue: "900101000001",
                            matches: [
                                {
                                    deviceId: "dev-1",
                                    terminalPersonId: "T-1"
                                }
                            ]
                        }
                    }),
                    { status: 200 }
                )
        });

        const result = await resolver.resolveByIin({ iin: "900101000001" });
        expect(result).toEqual({
            kind: "found",
            mappings: [
                {
                    deviceId: "dev-1",
                    terminalPersonId: "T-1"
                }
            ]
        });
    });

    it("returns not_found when DS returns empty matches", async () => {
        const resolver = createDeviceServicePersonResolver({
            baseUrl: "http://localhost:4010",
            token: "token",
            fetchImpl: async () =>
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            identityKey: "iin",
                            identityValue: "900101000001",
                            matches: []
                        }
                    }),
                    { status: 200 }
                )
        });

        const result = await resolver.resolveByIin({ iin: "900101000001" });
        expect(result).toEqual({ kind: "not_found" });
    });
});
