import { afterEach, describe, expect, it, vi } from "vitest";

import {
    applyAutoIdentities,
    applyPersonsImport,
    bulkCreatePersonTerminalUsers,
    bulkDeletePersons,
    createPersonTerminalUsers,
    createPersonsImportRun,
    deletePerson,
    findIdentityInDevice,
    listPersons,
    listPersonsImportCandidates,
    previewAutoIdentities,
    previewAutoIdentitiesByIin,
    updatePersonTerminalUsers
} from "./service";

describe("persons service", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it("loads persons with pagination query and page metadata", async () => {
        const fetchMock = vi.fn(() =>
            Promise.resolve({
                status: 200,
                json: () =>
                    Promise.resolve({
                        success: true,
                        data: {
                            persons: [],
                            page: { limit: 20, offset: 40, total: 100 }
                        }
                    })
            } as Response)
        );
        vi.stubGlobal("fetch", fetchMock);

        const result = await listPersons({
            limit: 20,
            offset: 40,
            iin: "0305",
            query: "ivan",
            linkedStatus: "linked",
            includeDeviceIds: ["dev-1", "dev-2"],
            excludeDeviceIds: ["dev-3"]
        });

        expect(result.page).toEqual({ limit: 20, offset: 40, total: 100 });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "http://localhost:3000/api/persons?limit=20&offset=40&iin=0305&query=ivan&linkedStatus=linked&includeDeviceIds=dev-1%2Cdev-2&excludeDeviceIds=dev-3",
            expect.any(Object)
        );
    });

    it("calls auto identity preview and apply endpoints", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            personId: "p1",
                            identityKey: "iin",
                            identityValue: "900101000001",
                            matches: [],
                            diagnostics: {
                                adaptersScanned: 0,
                                devicesScanned: 0,
                                devicesEligible: 0,
                                requestsSent: 0,
                                errors: 0
                            },
                            errors: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            iin: "900101000001",
                            identityKey: "iin",
                            identityValue: "900101000001",
                            matches: [],
                            diagnostics: {
                                adaptersScanned: 0,
                                devicesScanned: 0,
                                devicesEligible: 0,
                                requestsSent: 0,
                                errors: 0
                            },
                            errors: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            identityKey: "iin",
                            identityValue: "900101000001",
                            matches: [],
                            diagnostics: {
                                adaptersScanned: 0,
                                devicesScanned: 0,
                                devicesEligible: 0,
                                requestsSent: 0,
                                errors: 0
                            },
                            errors: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            personId: "p1",
                            total: 1,
                            linked: 1,
                            alreadyLinked: 0,
                            conflicts: 0,
                            errors: 0,
                            results: [{ deviceId: "dev-1", terminalPersonId: "T-1", status: "linked" }]
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            );
        vi.stubGlobal("fetch", fetchMock);

        await previewAutoIdentities("p1");
        await previewAutoIdentitiesByIin("900101000001");
        await findIdentityInDevice({
            deviceId: "dev-1",
            identityKey: "iin",
            identityValue: "900101000001"
        });
        await applyAutoIdentities("p1", {
            identities: [{ deviceId: "dev-1", terminalPersonId: "T-1" }]
        });

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "http://localhost:3000/api/persons/p1/identities/auto/preview",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "http://localhost:3000/api/persons/identities/auto/preview/by-iin",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            "http://localhost:3000/api/ds/identity/find",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            4,
            "http://localhost:3000/api/persons/p1/identities/auto/apply",
            expect.any(Object)
        );
    });

    it("calls persons import endpoints", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            run: {
                                id: "run-1",
                                status: "completed",
                                requestedByAdminId: "admin-1",
                                includeCards: true,
                                pageSize: 100,
                                deviceIds: ["dev-1"],
                                startedAt: "2026-03-01T10:00:00.000Z",
                                finishedAt: "2026-03-01T10:00:01.000Z",
                                summary: {
                                    deviceCount: 1,
                                    processedDeviceCount: 1,
                                    entryCount: 2,
                                    errorCount: 0,
                                    errors: []
                                }
                            }
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            groups: [],
                            page: { limit: 100, offset: 0, total: 0 },
                            summary: {
                                ready_create: 0,
                                ready_link: 0,
                                already_linked: 0,
                                conflict: 0,
                                missing_iin: 0,
                                stale_terminal_record: 0
                            }
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            total: 1,
                            applied: 1,
                            skipped: 0,
                            conflicts: 0,
                            errors: 0,
                            results: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            );
        vi.stubGlobal("fetch", fetchMock);

        await createPersonsImportRun({
            deviceIds: ["dev-1"],
            includeCards: true,
            pageSize: 100
        });
        await listPersonsImportCandidates({
            status: ["ready_create", "conflict"],
            deviceId: "dev-1",
            query: "9001",
            includeStale: false
        });
        await applyPersonsImport({
            operations: [
                {
                    type: "skip",
                    directoryEntryIds: ["dir-1"]
                }
            ]
        });

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "http://localhost:3000/api/persons/import-runs",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "http://localhost:3000/api/persons/import-candidates?limit=100&offset=0&includeStale=false&status=ready_create%2Cconflict&deviceId=dev-1&query=9001",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            "http://localhost:3000/api/persons/import/apply",
            expect.any(Object)
        );
    });

    it("calls person terminal sync endpoints", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            personId: "p1",
                            total: 1,
                            success: 1,
                            failed: 0,
                            results: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            personId: "p1",
                            total: 1,
                            success: 1,
                            failed: 0,
                            results: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            totalPersons: 1,
                            total: 2,
                            success: 2,
                            failed: 0,
                            results: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            );
        vi.stubGlobal("fetch", fetchMock);

        await createPersonTerminalUsers("p1", {
            deviceIds: ["dev-1"],
            terminalPersonId: "T-1"
        });
        await updatePersonTerminalUsers("p1");
        await bulkCreatePersonTerminalUsers({
            personIds: ["p1"],
            deviceIds: ["dev-1", "dev-2"],
            validFrom: "2026-03-06T08:00",
            validTo: "2027-03-06T08:00"
        });

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "http://localhost:3000/api/persons/p1/terminal-users/create",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "http://localhost:3000/api/persons/p1/terminal-users/update",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            "http://localhost:3000/api/persons/terminal-users/bulk-create",
            expect.any(Object)
        );
    });

    it("calls person delete endpoints", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            personId: "p1",
                            deleted: true,
                            detachedIdentities: 1,
                            deactivatedSubscriptions: 2,
                            unlinkedRequests: 3,
                            resetRequestsToNeedsPerson: 1
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        success: true,
                        data: {
                            total: 2,
                            deleted: 1,
                            notFound: 1,
                            errors: 0,
                            results: []
                        }
                    }),
                    { status: 200, headers: { "content-type": "application/json" } }
                )
            );
        vi.stubGlobal("fetch", fetchMock);

        await deletePerson("p1");
        await bulkDeletePersons({ personIds: ["p1", "p2"] });

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            "http://localhost:3000/api/persons/p1",
            expect.any(Object)
        );
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            "http://localhost:3000/api/persons/bulk-delete",
            expect.any(Object)
        );
    });
});
