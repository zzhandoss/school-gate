import { describe, expect, it, vi } from "vitest";

import { createPersonsTerminalSyncModule } from "../../../apps/api/src/composition/features/personsTerminalSync.feature.js";

describe("createPersonsTerminalSyncModule bulkCreateTerminalUsers", () => {
    it("skips already linked target devices and creates missing pairs", async () => {
        const createUsers = vi.fn(async () => ({
            results: [
                {
                    deviceId: "dev-2",
                    operation: "create" as const,
                    status: "success" as const,
                    steps: {
                        accessUser: "success" as const,
                        accessCard: "skipped" as const,
                        accessFace: "skipped" as const
                    }
                }
            ]
        }));
        const createIdentity = vi.fn(async () => undefined);
        const enqueueAudit = vi.fn();

        const module = createPersonsTerminalSyncModule({
            personsService: {
                getById: async (personId: string) => ({
                    id: personId,
                    iin: "030512550123",
                    terminalPersonId: null,
                    firstName: "Ivan",
                    lastName: "Petrov",
                    createdAt: new Date("2026-03-06T00:00:00.000Z")
                })
            } as any,
            personTerminalIdentitiesService: {
                listByPersonId: async ({ personId }: { personId: string }) => personId === "p1"
                    ? [
                        {
                            id: "pti-1",
                            personId: "p1",
                            deviceId: "dev-1",
                            terminalPersonId: "terminal-user-1",
                            createdAt: new Date("2026-03-05T00:00:00.000Z")
                        }
                    ]
                    : [],
                getByDeviceAndTerminalPersonId: async () => null,
                getByPersonAndDevice: async ({ deviceId }: { deviceId: string }) => deviceId === "dev-1"
                    ? {
                        id: "pti-1",
                        personId: "p1",
                        deviceId: "dev-1",
                        terminalPersonId: "terminal-user-1",
                        createdAt: new Date("2026-03-05T00:00:00.000Z")
                    }
                    : null,
                create: createIdentity
            } as any,
            deviceServiceGateway: {
                listDevices: async () => ({
                    devices: [
                        {
                            deviceId: "dev-1",
                            settingsJson: JSON.stringify({
                                identityQueryMappings: {
                                    iin: {
                                        provider: "dahua.accessControlIdentity",
                                        paramsTemplate: {
                                            "accessUser.Condition.UserID": "{{identityValue}}"
                                        }
                                    }
                                }
                            })
                        },
                        {
                            deviceId: "dev-2",
                            settingsJson: JSON.stringify({
                                identityQueryMappings: {
                                    iin: {
                                        provider: "dahua.accessControlIdentity",
                                        paramsTemplate: {
                                            "accessUser.Condition.UserID": "{{identityValue}}"
                                        }
                                    }
                                }
                            })
                        }
                    ]
                }),
                createUsers
            } as any,
            nextId: () => "pti-2",
            now: () => new Date("2026-03-06T00:00:00.000Z"),
            enqueueAudit
        });

        const result = await module.bulkCreateTerminalUsers({
            body: {
                personIds: ["p1"],
                deviceIds: ["dev-1", "dev-2"],
                validFrom: "2026-03-06 08:00:00",
                validTo: "2027-03-06 08:00:00"
            },
            adminId: "admin-1"
        });

        expect(createUsers).toHaveBeenCalledTimes(1);
        expect(createUsers).toHaveBeenCalledWith(expect.objectContaining({
            payload: {
                target: {
                    mode: "device",
                    deviceId: "dev-2"
                },
                person: expect.objectContaining({
                    userId: "terminal-user-1"
                })
            }
        }));
        expect(createIdentity).toHaveBeenCalledWith(expect.objectContaining({
            personId: "p1",
            deviceId: "dev-2",
            terminalPersonId: "terminal-user-1"
        }));
        expect(result).toMatchObject({
            totalPersons: 1,
            total: 2,
            success: 1,
            failed: 0,
            results: [
                {
                    personId: "p1",
                    userId: "terminal-user-1",
                    total: 2,
                    success: 1,
                    failed: 0,
                    results: [
                        {
                            deviceId: "dev-1",
                            status: "skipped",
                            skipCode: "person_terminal_sync_device_already_linked"
                        },
                        {
                            deviceId: "dev-2",
                            status: "success"
                        }
                    ]
                }
            ]
        });
        expect(enqueueAudit).toHaveBeenCalledWith(expect.objectContaining({
            action: "person_terminal_users_bulk_created",
            meta: expect.objectContaining({
                total: 2,
                success: 1,
                failed: 0,
                skipped: 1
            })
        }));
    });

    it("uses mapped iin fallback for bulk create when person has no terminal identity yet", async () => {
        const createUsers = vi.fn(async () => ({
            results: [
                {
                    deviceId: "dev-3",
                    operation: "create" as const,
                    status: "success" as const,
                    steps: {
                        accessUser: "success" as const,
                        accessCard: "skipped" as const,
                        accessFace: "skipped" as const
                    }
                }
            ]
        }));
        const createIdentity = vi.fn(async () => undefined);

        const module = createPersonsTerminalSyncModule({
            personsService: {
                getById: async () => ({
                    id: "p2",
                    iin: "900101000001",
                    terminalPersonId: null,
                    firstName: "Ivan",
                    lastName: "Petrov",
                    createdAt: new Date("2026-03-06T00:00:00.000Z")
                })
            } as any,
            personTerminalIdentitiesService: {
                listByPersonId: async () => [],
                getByDeviceAndTerminalPersonId: async () => null,
                getByPersonAndDevice: async () => null,
                create: createIdentity
            } as any,
            deviceServiceGateway: {
                listDevices: async () => ({
                    devices: [
                        {
                            deviceId: "dev-3",
                            settingsJson: JSON.stringify({
                                identityQueryMappings: {
                                    iin: {
                                        provider: "dahua.accessControlIdentity",
                                        paramsTemplate: {
                                            "accessUser.Condition.UserID": "{{identityValue}}"
                                        }
                                    }
                                }
                            })
                        }
                    ]
                }),
                createUsers
            } as any,
            nextId: () => "pti-3",
            now: () => new Date("2026-03-06T00:00:00.000Z"),
            enqueueAudit: vi.fn()
        });

        const result = await module.bulkCreateTerminalUsers({
            body: {
                personIds: ["p2"],
                deviceIds: ["dev-3"],
                validFrom: "2026-03-06 08:00:00",
                validTo: "2027-03-06 08:00:00"
            },
            adminId: "admin-1",
            admin: {
                adminId: "admin-1",
                roleId: "role-1",
                permissions: ["persons.write"]
            }
        });

        expect(createUsers).toHaveBeenCalledWith(expect.objectContaining({
            payload: {
                target: {
                    mode: "device",
                    deviceId: "dev-3"
                },
                person: expect.objectContaining({
                    userId: "900101000001"
                })
            }
        }));
        expect(createIdentity).toHaveBeenCalledWith(expect.objectContaining({
            personId: "p2",
            deviceId: "dev-3",
            terminalPersonId: "900101000001"
        }));
        expect(result).toMatchObject({
            totalPersons: 1,
            total: 1,
            success: 1,
            failed: 0
        });
    });
});
