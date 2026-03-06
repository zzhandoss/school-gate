import type {
    BulkCreatePersonTerminalUsersDto,
    BulkPersonTerminalSyncResultDto,
    CreatePersonTerminalUsersDto,
    GetPersonTerminalUserPhotoDto,
    PersonTerminalUserPhotoResultDto,
    PersonTerminalSyncResultDto,
    UpdatePersonTerminalUsersDto
} from "@school-gate/contracts";
import type {
    PersonTerminalIdentitiesService,
    PersonsService
} from "@school-gate/core";
import { PersonNotFoundError, TerminalIdentityAlreadyMappedError } from "@school-gate/core";
import { HttpError } from "../../delivery/http/errors/httpError.js";
import type { DeviceServiceGatewayModule } from "../../delivery/http/routes/deviceServiceGateway.routes.js";

type TerminalSyncDeps = {
    personsService: PersonsService;
    personTerminalIdentitiesService: PersonTerminalIdentitiesService;
    deviceServiceGateway: DeviceServiceGatewayModule;
    nextId: () => string;
    now: () => Date;
    enqueueAudit: (input: {
        action: string;
        entityId: string;
        actorId: string;
        meta: Record<string, unknown>;
    }) => void;
};

type TargetDevice = {
    deviceId: string;
    userId: string;
};

function formatDisplayName(input: { firstName: string | null; lastName: string | null; iin: string }) {
    return [input.firstName, input.lastName].filter((value): value is string => Boolean(value)).join(" ").trim() || input.iin;
}

function buildGroupedTargets(targets: TargetDevice[]) {
    const grouped = new Map<string, string[]>();
    for (const target of targets) {
        const current = grouped.get(target.userId) ?? [];
        current.push(target.deviceId);
        grouped.set(target.userId, current);
    }
    return grouped;
}

function createFailureResults(input: {
    deviceIds: string[];
    operation: "create" | "update";
    errorCode: string;
    errorMessage: string;
}): PersonTerminalSyncResultDto["results"] {
    return Array.from(new Set(input.deviceIds))
        .sort((left, right) => left.localeCompare(right))
        .map((deviceId) => ({
            deviceId,
            operation: input.operation,
            status: "failed" as const,
            steps: {
                accessUser: "failed" as const,
                accessCard: "skipped" as const,
                accessFace: "skipped" as const
            },
            errorCode: input.errorCode,
            errorMessage: input.errorMessage
        }));
}

function createSkippedResults(input: {
    deviceIds: string[];
    operation: "create" | "update";
    skipCode: string;
    skipMessage: string;
}): PersonTerminalSyncResultDto["results"] {
    return Array.from(new Set(input.deviceIds))
        .sort((left, right) => left.localeCompare(right))
        .map((deviceId) => ({
            deviceId,
            operation: input.operation,
            status: "skipped" as const,
            steps: {
                accessUser: "skipped" as const,
                accessCard: "skipped" as const,
                accessFace: "skipped" as const
            },
            skipCode: input.skipCode,
            skipMessage: input.skipMessage
        }));
}

function toErrorMeta(error: unknown) {
    if (error instanceof HttpError) {
        return {
            errorCode: error.response.code,
            errorMessage: error.response.message
        };
    }
    if (error instanceof PersonNotFoundError || error instanceof TerminalIdentityAlreadyMappedError) {
        return {
            errorCode: error.code.toLowerCase(),
            errorMessage: error.message
        };
    }
    if (error instanceof Error) {
        return {
            errorCode: "person_terminal_sync_failed",
            errorMessage: error.message
        };
    }
    return {
        errorCode: "person_terminal_sync_failed",
        errorMessage: String(error)
    };
}

async function resolveTargets(
    deps: TerminalSyncDeps,
    input: {
        personId: string;
        deviceIds?: string[] | undefined;
        terminalPersonId?: string | undefined;
        fallbackToLinkedDevices: boolean;
    }
) {
    const person = await deps.personsService.getById(input.personId);
    if (!person) {
        throw new PersonNotFoundError();
    }

    const linkedIdentities = await deps.personTerminalIdentitiesService.listByPersonId({ personId: input.personId });
    const linkedByDevice = new Map(linkedIdentities.map((identity) => [identity.deviceId, identity]));
    const fallbackLinkedTerminalPersonId = linkedIdentities[0]?.terminalPersonId ?? null;
    const targetDeviceIds = input.deviceIds && input.deviceIds.length > 0
        ? Array.from(new Set(input.deviceIds))
        : input.fallbackToLinkedDevices
            ? linkedIdentities.map((identity) => identity.deviceId)
            : [];

    if (targetDeviceIds.length === 0) {
        throw new HttpError({
            status: 400,
            code: "person_terminal_sync_devices_required",
            message: "At least one target device is required"
        });
    }

    const targets: TargetDevice[] = [];
    for (const deviceId of targetDeviceIds) {
        const existing = linkedByDevice.get(deviceId) ?? null;
        const userId = input.terminalPersonId ?? existing?.terminalPersonId ?? person.terminalPersonId ?? fallbackLinkedTerminalPersonId ?? null;
        if (!userId) {
            throw new HttpError({
                status: 400,
                code: "person_terminal_sync_terminal_person_id_required",
                message: `Terminal person id is required for device ${deviceId}`
            });
        }

        const owner = await deps.personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
            deviceId,
            terminalPersonId: userId
        });
        if (owner && owner.personId !== input.personId) {
            throw new TerminalIdentityAlreadyMappedError();
        }
        if (existing && existing.terminalPersonId !== userId) {
            throw new HttpError({
                status: 409,
                code: "person_device_identity_exists",
                message: "Person already has another identity on this device"
            });
        }

        targets.push({ deviceId, userId });
    }

    return { person, targets };
}

async function runWrite(
    deps: TerminalSyncDeps,
    input: {
        personId: string;
        adminId?: string | undefined;
        authorizationHeader?: string | undefined;
        operation: "create" | "update";
        body: (CreatePersonTerminalUsersDto | UpdatePersonTerminalUsersDto) & {
            displayName?: string | null | undefined;
            citizenIdNo?: string | null | undefined;
        };
    }
): Promise<PersonTerminalSyncResultDto> {
    const { person, targets } = await resolveTargets(deps, {
        personId: input.personId,
        ...(input.body.deviceIds !== undefined ? { deviceIds: input.body.deviceIds } : {}),
        ...(input.body.terminalPersonId !== undefined
            ? { terminalPersonId: input.body.terminalPersonId }
            : {}),
        fallbackToLinkedDevices: input.operation === "update"
    });
    const groupedTargets = buildGroupedTargets(targets);
    const displayName = input.body.displayName?.trim() || formatDisplayName({
        firstName: person.firstName,
        lastName: person.lastName,
        iin: person.iin
    });
    const citizenIdNo = input.body.citizenIdNo?.trim() || person.iin;

    const allResults: PersonTerminalSyncResultDto["results"] = [];
    for (const [userId, deviceIds] of groupedTargets) {
        const payload = {
            target: deviceIds.length === 1 ? { mode: "device" as const, deviceId: deviceIds[0]! } : { mode: "devices" as const, deviceIds },
            person: {
                userId,
                displayName,
                userType: input.body.userType ?? 0,
                userStatus: input.body.userStatus ?? 0,
                authority: input.body.authority ?? 2,
                citizenIdNo,
                validFrom: input.body.validFrom ?? null,
                validTo: input.body.validTo ?? null,
                ...(input.body.card ? { card: input.body.card } : {}),
                ...(input.body.face ? { face: input.body.face } : {})
            }
        };

        const response = input.operation === "create"
            ? await deps.deviceServiceGateway.createUsers({
                payload,
                admin: undefined,
                ...(input.authorizationHeader !== undefined
                    ? { authorizationHeader: input.authorizationHeader }
                    : { authorizationHeader: undefined })
            })
            : await deps.deviceServiceGateway.updateUsers({
                payload,
                admin: undefined,
                ...(input.authorizationHeader !== undefined
                    ? { authorizationHeader: input.authorizationHeader }
                    : { authorizationHeader: undefined })
            });

        allResults.push(...response.results);

        if (input.operation === "create") {
            for (const result of response.results) {
                if (result.status !== "success") {
                    continue;
                }
                const existing = await deps.personTerminalIdentitiesService.getByPersonAndDevice({
                    personId: input.personId,
                    deviceId: result.deviceId
                });
                if (!existing) {
                    await deps.personTerminalIdentitiesService.create({
                        id: deps.nextId(),
                        personId: input.personId,
                        deviceId: result.deviceId,
                        terminalPersonId: userId
                    });
                }
            }
        }
    }

    const success = allResults.filter((result) => result.status === "success").length;
    const failed = allResults.filter((result) => result.status === "failed").length;
    const skipped = allResults.filter((result) => result.status === "skipped").length;
    const actorId = input.adminId ?? `system:person_terminal_${input.operation}`;
    deps.enqueueAudit({
        action: input.operation === "create" ? "person_terminal_users_created" : "person_terminal_users_updated",
        entityId: input.personId,
        actorId,
        meta: {
            operation: input.operation,
            total: allResults.length,
            success,
            failed,
            skipped,
            deviceIds: allResults.map((result) => result.deviceId)
        }
    });

    return {
        personId: input.personId,
        total: allResults.length,
        success,
        failed,
        results: allResults.sort((left, right) => left.deviceId.localeCompare(right.deviceId))
    };
}

async function runBulkCreate(
    deps: TerminalSyncDeps,
    input: {
        body: BulkCreatePersonTerminalUsersDto;
        adminId?: string | undefined;
        authorizationHeader?: string | undefined;
    }
): Promise<BulkPersonTerminalSyncResultDto> {
    const personIds = Array.from(new Set(input.body.personIds));
    const deviceIds = Array.from(new Set(input.body.deviceIds));
    const results: BulkPersonTerminalSyncResultDto["results"] = [];

    for (const personId of personIds) {
        const person = await deps.personsService.getById(personId);
        if (!person) {
            const failedResults = createFailureResults({
                deviceIds,
                operation: "create",
                errorCode: "person_not_found",
                errorMessage: "Person was not found"
            });
            results.push({
                personId,
                userId: personId,
                total: failedResults.length,
                success: 0,
                failed: failedResults.length,
                results: failedResults
            });
            continue;
        }

        const linkedIdentities = await deps.personTerminalIdentitiesService.listByPersonId({ personId });
        const linkedDeviceIdSet = new Set(linkedIdentities.map((identity) => identity.deviceId));
        const skippedDeviceIds = deviceIds.filter((deviceId) => linkedDeviceIdSet.has(deviceId));
        const createDeviceIds = deviceIds.filter((deviceId) => !linkedDeviceIdSet.has(deviceId));
        const skippedResults = createSkippedResults({
            deviceIds: skippedDeviceIds,
            operation: "create",
            skipCode: "person_terminal_sync_device_already_linked",
            skipMessage: "Person is already linked to this terminal"
        });

        try {
            const createResult = createDeviceIds.length > 0
                ? await runWrite(deps, {
                    personId,
                    body: {
                        deviceIds: createDeviceIds,
                        terminalPersonId: person.terminalPersonId ?? linkedIdentities[0]?.terminalPersonId,
                        ...(input.body.validFrom !== undefined ? { validFrom: input.body.validFrom } : {}),
                        ...(input.body.validTo !== undefined ? { validTo: input.body.validTo } : {})
                    },
                    ...(input.adminId !== undefined ? { adminId: input.adminId } : {}),
                    ...(input.authorizationHeader !== undefined
                        ? { authorizationHeader: input.authorizationHeader }
                        : {}),
                    operation: "create"
                })
                : {
                    personId,
                    total: 0,
                    success: 0,
                    failed: 0,
                    results: [] as PersonTerminalSyncResultDto["results"]
                };
            const personResults = [...createResult.results, ...skippedResults]
                .sort((left, right) => left.deviceId.localeCompare(right.deviceId));
            const success = personResults.filter((result) => result.status === "success").length;
            const failed = personResults.filter((result) => result.status === "failed").length;
            results.push({
                personId: createResult.personId,
                userId: person.terminalPersonId ?? linkedIdentities[0]?.terminalPersonId ?? person.iin,
                total: personResults.length,
                success,
                failed,
                results: personResults
            });
        } catch (error) {
            const { errorCode, errorMessage } = toErrorMeta(error);
            const failedResults = createFailureResults({
                deviceIds: createDeviceIds,
                operation: "create",
                errorCode,
                errorMessage
            });
            const personResults = [...failedResults, ...skippedResults]
                .sort((left, right) => left.deviceId.localeCompare(right.deviceId));
            results.push({
                personId,
                userId: person.terminalPersonId ?? linkedIdentities[0]?.terminalPersonId ?? person.iin,
                total: personResults.length,
                success: 0,
                failed: failedResults.length,
                results: personResults
            });
        }
    }

    const total = results.reduce((sum, item) => sum + item.total, 0);
    const success = results.reduce((sum, item) => sum + item.success, 0);
    const failed = results.reduce((sum, item) => sum + item.failed, 0);
    const skipped = total - success - failed;
    const actorId = input.adminId ?? "system:person_terminal_bulk_create";
    deps.enqueueAudit({
        action: "person_terminal_users_bulk_created",
        entityId: "bulk",
        actorId,
        meta: {
            totalPersons: results.length,
            total,
            success,
            failed,
            skipped,
            personIds: results.map((item) => item.personId),
            deviceIds
        }
    });

    return {
        totalPersons: results.length,
        total,
        success,
        failed,
        results
    };
}

export function createPersonsTerminalSyncModule(deps: TerminalSyncDeps) {
    return {
        bulkCreateTerminalUsers: (input: {
            body: BulkCreatePersonTerminalUsersDto;
            adminId?: string | undefined;
            authorizationHeader?: string | undefined;
        }) =>
            runBulkCreate(deps, {
                body: input.body,
                ...(input.adminId !== undefined ? { adminId: input.adminId } : {}),
                ...(input.authorizationHeader !== undefined
                    ? { authorizationHeader: input.authorizationHeader }
                    : {})
            }),
        createTerminalUsers: (input: {
            personId: string;
            body: CreatePersonTerminalUsersDto;
            adminId?: string | undefined;
            authorizationHeader?: string | undefined;
        }) =>
            runWrite(deps, {
                personId: input.personId,
                body: input.body,
                ...(input.adminId !== undefined ? { adminId: input.adminId } : {}),
                ...(input.authorizationHeader !== undefined
                    ? { authorizationHeader: input.authorizationHeader }
                    : {}),
                operation: "create"
            }),
        updateTerminalUsers: (input: {
            personId: string;
            body: UpdatePersonTerminalUsersDto;
            adminId?: string | undefined;
            authorizationHeader?: string | undefined;
        }) =>
            runWrite(deps, {
                personId: input.personId,
                body: input.body,
                ...(input.adminId !== undefined ? { adminId: input.adminId } : {}),
                ...(input.authorizationHeader !== undefined
                    ? { authorizationHeader: input.authorizationHeader }
                    : {}),
                operation: "update"
            }),
        getTerminalUserPhoto: async (input: {
            personId: string;
            body: GetPersonTerminalUserPhotoDto;
            authorizationHeader?: string | undefined;
        }): Promise<PersonTerminalUserPhotoResultDto> => {
            const person = await deps.personsService.getById(input.personId);
            if (!person) {
                throw new PersonNotFoundError();
            }

            const linkedIdentity = await deps.personTerminalIdentitiesService.getByPersonAndDevice({
                personId: input.personId,
                deviceId: input.body.deviceId
            });
            const userId = input.body.userId ?? linkedIdentity?.terminalPersonId ?? null;
            if (!userId) {
                throw new HttpError({
                    status: 400,
                    code: "person_terminal_sync_terminal_person_id_required",
                    message: `Terminal person id is required for device ${input.body.deviceId}`
                });
            }

            const response = await deps.deviceServiceGateway.getUserPhoto({
                payload: {
                    target: {
                        mode: "device",
                        deviceId: input.body.deviceId
                    },
                    userId
                },
                admin: undefined,
                ...(input.authorizationHeader !== undefined
                    ? { authorizationHeader: input.authorizationHeader }
                    : { authorizationHeader: undefined })
            });

            return {
                personId: input.personId,
                photo: response.photo
            };
        }
    };
}
