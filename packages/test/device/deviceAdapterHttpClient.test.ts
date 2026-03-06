import { describe, expect, it } from "vitest";
import { createDeviceAdapterHttpClient } from "@school-gate/device/infra/http/deviceAdapterHttpClient";

describe("createDeviceAdapterHttpClient exportUsers", () => {
    it("normalizes blank optional strings from adapter export payload", async () => {
        const fetchMock: typeof fetch = async () =>
            new Response(
                JSON.stringify({
                    success: true,
                    data: {
                        view: "grouped",
                        devices: [
                            {
                                deviceId: "dahua_test_3",
                                exportedCount: 1,
                                failed: false,
                                hasMore: false,
                                errorCode: "",
                                errorMessage: " ",
                                users: [
                                    {
                                        deviceId: "dahua_test_3",
                                        terminalPersonId: "100013",
                                        displayName: " ",
                                        userType: "0",
                                        userStatus: "",
                                        authority: "2",
                                        citizenIdNo: "",
                                        validFrom: "",
                                        validTo: null,
                                        cardNo: "",
                                        cardName: " ",
                                        sourceSummary: ["accessUser", "", "  "],
                                        rawUserPayload: "",
                                        rawCardPayload: " "
                                    }
                                ]
                            }
                        ]
                    }
                }),
                {
                    status: 200,
                    headers: { "content-type": "application/json" }
                }
            );

        const client = createDeviceAdapterHttpClient({
            baseUrl: "http://adapter.local",
            token: "token",
            fetchImpl: fetchMock
        });

        const result = await client.exportUsers({
            target: { mode: "device", deviceId: "dahua_test_3" },
            view: "grouped",
            limit: 100,
            offset: 0,
            includeCards: true
        });

        expect(result).toEqual({
            view: "grouped",
            devices: [
                {
                    deviceId: "dahua_test_3",
                    exportedCount: 1,
                    failed: false,
                    hasMore: false,
                    errorCode: null,
                    errorMessage: null,
                    users: [
                        {
                            deviceId: "dahua_test_3",
                            terminalPersonId: "100013",
                            displayName: null,
                            userType: "0",
                            userStatus: null,
                            authority: "2",
                            citizenIdNo: null,
                            validFrom: null,
                            validTo: null,
                            cardNo: null,
                            cardName: null,
                            sourceSummary: ["accessUser"],
                            rawUserPayload: null,
                            rawCardPayload: null
                        }
                    ]
                }
            ]
        });
    });
});
