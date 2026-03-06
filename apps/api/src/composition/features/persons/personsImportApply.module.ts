import type { ApplyPersonsImportResultDto } from "@school-gate/contracts";
import { TerminalIdentityAlreadyMappedError } from "@school-gate/core";
import { HttpError } from "../../../delivery/http/errors/httpError.js";
import type { PersonsImportModule } from "../../../delivery/http/routes/persons/persons.types.js";
import {
    createPersonsImportStorageHttpError,
    isMissingPersonsImportStorageError
} from "./personsImport.shared.js";

type DirectoryEntry = {
    deviceId: string;
    terminalPersonId: string;
};

type PersonsImportApplyDeps = {
    nextId: () => string;
    personsService: {
        getByIin: (iin: string) => Promise<{ id: string } | null>;
        create: (input: { id: string; iin: string; firstName: string | null; lastName: string | null }) => Promise<void>;
    };
    personTerminalIdentitiesService: {
        getByDeviceAndTerminalPersonId: (input: { deviceId: string; terminalPersonId: string }) => Promise<{
            id: string;
            personId: string;
        } | null>;
        getByPersonAndDevice: (input: { personId: string; deviceId: string }) => Promise<{
            terminalPersonId: string;
        } | null>;
        create: (input: { id: string; personId: string; deviceId: string; terminalPersonId: string }) => Promise<void>;
        deleteById: (input: { id: string }) => Promise<void>;
    };
    terminalDirectoryEntriesRepo: {
        getByIds: (input: { ids: string[] }) => Promise<DirectoryEntry[]>;
    };
    mapPersonTerminalIdentity: (input: {
        personId: string;
        deviceId: string;
        terminalPersonId: string;
        adminId?: string;
    }) => Promise<{ status: "linked" | "already_linked" }>;
    enqueueAudit: (input: {
        actorId: string;
        action: string;
        entityType: string;
        entityId: string;
        meta: Record<string, unknown>;
    }) => void;
};

export function createPersonsImportApplyModule(
    deps: PersonsImportApplyDeps
): Pick<PersonsImportModule, "applyImport"> {
    return {
        applyImport: async ({ body, adminId }) => {
            try {
                const results: ApplyPersonsImportResultDto["results"] = [];
                let applied = 0;
                let skipped = 0;
                let conflicts = 0;
                let errors = 0;

                for (const operation of body.operations) {
                    if (operation.type === "skip") {
                        skipped += 1;
                        results.push({
                            type: operation.type,
                            directoryEntryIds: operation.directoryEntryIds,
                            status: "skipped",
                            message: "Skipped by operator"
                        });
                        continue;
                    }

                    const entries = await deps.terminalDirectoryEntriesRepo.getByIds({ ids: operation.directoryEntryIds });
                    if (entries.length !== operation.directoryEntryIds.length) {
                        errors += 1;
                        results.push({
                            type: operation.type,
                            directoryEntryIds: operation.directoryEntryIds,
                            status: "error",
                            message: "One or more import entries were not found"
                        });
                        continue;
                    }

                    try {
                        let targetPersonId = operation.targetPersonId ?? null;
                        if (operation.type === "create_person_and_link") {
                            if (!operation.personDraft) {
                                throw new HttpError({
                                    status: 400,
                                    code: "person_import_person_draft_required",
                                    message: "Person draft is required for create operation"
                                });
                            }

                            const existing = await deps.personsService.getByIin(operation.personDraft.iin);
                            if (existing) {
                                targetPersonId = existing.id;
                            } else {
                                const createdPersonId = deps.nextId();
                                await deps.personsService.create({
                                    id: createdPersonId,
                                    iin: operation.personDraft.iin,
                                    firstName: operation.personDraft.firstName ?? null,
                                    lastName: operation.personDraft.lastName ?? null
                                });
                                targetPersonId = createdPersonId;
                            }
                        }

                        if (!targetPersonId) {
                            throw new HttpError({
                                status: 400,
                                code: "person_import_target_person_required",
                                message: "Target person is required"
                            });
                        }

                        if (operation.type === "reassign_identity") {
                            for (const entry of entries) {
                                const existingIdentity =
                                    await deps.personTerminalIdentitiesService.getByDeviceAndTerminalPersonId({
                                        deviceId: entry.deviceId,
                                        terminalPersonId: entry.terminalPersonId
                                    });
                                if (!existingIdentity) {
                                    continue;
                                }

                                if (
                                    operation.expectedCurrentPersonId !== undefined &&
                                    existingIdentity.personId !== operation.expectedCurrentPersonId
                                ) {
                                    throw new HttpError({
                                        status: 409,
                                        code: "person_import_identity_reassign_conflict",
                                        message: "Identity owner changed before reassignment"
                                    });
                                }

                                const targetExisting = await deps.personTerminalIdentitiesService.getByPersonAndDevice({
                                    personId: targetPersonId,
                                    deviceId: entry.deviceId
                                });
                                if (targetExisting && targetExisting.terminalPersonId !== entry.terminalPersonId) {
                                    throw new HttpError({
                                        status: 409,
                                        code: "person_device_identity_exists",
                                        message: "Target person already has another identity on this device"
                                    });
                                }

                                if (!targetExisting) {
                                    await deps.personTerminalIdentitiesService.create({
                                        id: deps.nextId(),
                                        personId: targetPersonId,
                                        deviceId: entry.deviceId,
                                        terminalPersonId: entry.terminalPersonId
                                    });
                                }

                                await deps.personTerminalIdentitiesService.deleteById({ id: existingIdentity.id });
                            }
                        } else {
                            for (const entry of entries) {
                                await deps.mapPersonTerminalIdentity({
                                    personId: targetPersonId,
                                    deviceId: entry.deviceId,
                                    terminalPersonId: entry.terminalPersonId,
                                    ...(adminId !== undefined ? { adminId } : {})
                                });
                            }
                        }

                        applied += 1;
                        results.push({
                            type: operation.type,
                            directoryEntryIds: operation.directoryEntryIds,
                            status: "applied",
                            personId: targetPersonId
                        });
                    } catch (error) {
                        if (
                            error instanceof TerminalIdentityAlreadyMappedError ||
                            (error instanceof HttpError && error.response.status === 409)
                        ) {
                            conflicts += 1;
                            results.push({
                                type: operation.type,
                                directoryEntryIds: operation.directoryEntryIds,
                                status: "conflict",
                                message: error instanceof Error ? error.message : "Conflict"
                            });
                            continue;
                        }

                        errors += 1;
                        results.push({
                            type: operation.type,
                            directoryEntryIds: operation.directoryEntryIds,
                            status: "error",
                            message: error instanceof Error ? error.message : String(error)
                        });
                    }
                }

                const payload: ApplyPersonsImportResultDto = {
                    total: body.operations.length,
                    applied,
                    skipped,
                    conflicts,
                    errors,
                    results
                };

                deps.enqueueAudit({
                    actorId: adminId ?? "system:terminal_directory_apply",
                    action: "terminal_directory_apply_completed",
                    entityType: "terminal_directory",
                    entityId: "bulk_apply",
                    meta: payload
                });

                return payload;
            } catch (error) {
                if (isMissingPersonsImportStorageError(error)) {
                    throw createPersonsImportStorageHttpError();
                }

                throw error;
            }
        }
    };
}
