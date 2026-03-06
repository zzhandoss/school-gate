import type {
    ListPersonsImportCandidatesResultDto,
    PersonImportCandidateEntryDto,
    PersonImportCandidateGroupDto,
    PersonImportCandidateStatusDto
} from "@school-gate/contracts";
import type { PersonsImportModule } from "../../../delivery/http/routes/persons/persons.types.js";
import {
    createImportSummarySeed,
    formatImportPersonName,
    isMissingPersonsImportStorageError
} from "./personsImport.shared.js";

type DirectoryEntry = {
    id: string;
    deviceId: string;
    terminalPersonId: string;
    iin: string | null;
    displayName: string | null;
    userType: string | null;
    userStatus: string | null;
    authority: string | null;
    validFrom: string | null;
    validTo: string | null;
    cardNo: string | null;
    cardName: string | null;
    sourceSummary: string[];
    isPresentInLastSync: boolean;
    lastSeenAt: Date;
};

type PersonListItem = {
    id: string;
    iin: string;
    firstName: string | null;
    lastName: string | null;
};

type PersonsImportReviewDeps = {
    personsService: {
        list: (input: { limit: number; offset: number }) => Promise<PersonListItem[]>;
    };
    personTerminalIdentitiesService: {
        listByPersonId: (input: { personId: string }) => Promise<Array<{
            personId: string;
            deviceId: string;
            terminalPersonId: string;
        }>>;
    };
    terminalDirectoryEntriesRepo: {
        list: (input: {
            deviceId?: string;
            iin?: string;
            query?: string;
            includeStale: boolean;
        }) => Promise<DirectoryEntry[]>;
    };
};

export function createPersonsImportReviewModule(
    deps: PersonsImportReviewDeps
): Pick<PersonsImportModule, "listImportCandidates"> {
    return {
        listImportCandidates: async (query) => {
            let entries: DirectoryEntry[];
            try {
                entries = await deps.terminalDirectoryEntriesRepo.list({
                    ...(query.deviceId ? { deviceId: query.deviceId } : {}),
                    ...(query.iin ? { iin: query.iin } : {}),
                    ...(query.query ? { query: query.query } : {}),
                    includeStale: query.includeStale
                });
            } catch (error) {
                if (isMissingPersonsImportStorageError(error)) {
                    return {
                        groups: [],
                        page: {
                            limit: query.limit,
                            offset: query.offset,
                            total: 0
                        },
                        summary: createImportSummarySeed()
                    };
                }

                throw error;
            }

            const persons = await deps.personsService.list({ limit: 10000, offset: 0 });
            const identities = await Promise.all(
                persons.map((person) => deps.personTerminalIdentitiesService.listByPersonId({ personId: person.id }))
            );
            const personsById = new Map(persons.map((person) => [person.id, person]));
            const personsByIin = new Map(persons.map((person) => [person.iin, person]));
            const identityByDeviceTerminal = new Map(
                identities
                    .flat()
                    .map((identity) => [`${identity.deviceId}:${identity.terminalPersonId}`, identity] as const)
            );
            const grouped = new Map<string, DirectoryEntry[]>();

            for (const entry of entries) {
                const key = entry.iin ? `iin:${entry.iin}` : `entry:${entry.deviceId}:${entry.terminalPersonId}`;
                const current = grouped.get(key) ?? [];
                current.push(entry);
                grouped.set(key, current);
            }

            const groups: PersonImportCandidateGroupDto[] = [];
            const summary = createImportSummarySeed();

            for (const [groupKey, groupEntries] of grouped) {
                const iin = groupEntries[0]?.iin ?? null;
                const suggestedPerson = iin ? personsByIin.get(iin) ?? null : null;
                const nameSet = new Set(
                    groupEntries.map((entry) => entry.displayName).filter((value): value is string => Boolean(value))
                );
                const warnings: string[] = [];
                if (nameSet.size > 1) {
                    warnings.push("names_differ_across_devices");
                }
                if (groupEntries.some((entry) => !entry.isPresentInLastSync)) {
                    warnings.push("contains_stale_entries");
                }

                let status: PersonImportCandidateStatusDto;
                if (groupEntries.some((entry) => !entry.isPresentInLastSync)) {
                    status = "stale_terminal_record";
                } else if (groupEntries.some((entry) => !entry.iin)) {
                    status = "missing_iin";
                } else {
                    const linkedPersonIds = new Set(
                        groupEntries
                            .map((entry) => identityByDeviceTerminal.get(`${entry.deviceId}:${entry.terminalPersonId}`)?.personId ?? null)
                            .filter((value): value is string => Boolean(value))
                    );

                    if (linkedPersonIds.size > 1) {
                        status = "conflict";
                    } else if (suggestedPerson) {
                        if (
                            linkedPersonIds.size === 1 &&
                            linkedPersonIds.has(suggestedPerson.id) &&
                            groupEntries.every((entry) =>
                                identityByDeviceTerminal.has(`${entry.deviceId}:${entry.terminalPersonId}`)
                            )
                        ) {
                            status = "already_linked";
                        } else if (linkedPersonIds.size === 0 || linkedPersonIds.has(suggestedPerson.id)) {
                            status = "ready_link";
                        } else {
                            status = "conflict";
                        }
                    } else if (linkedPersonIds.size > 0) {
                        status = "conflict";
                    } else {
                        status = "ready_create";
                    }
                }

                summary[status] += 1;
                const itemEntries: PersonImportCandidateEntryDto[] = groupEntries.map((entry) => {
                    const linkedIdentity = identityByDeviceTerminal.get(`${entry.deviceId}:${entry.terminalPersonId}`) ?? null;
                    const linkedPerson = linkedIdentity ? personsById.get(linkedIdentity.personId) ?? null : null;

                    return {
                        directoryEntryId: entry.id,
                        deviceId: entry.deviceId,
                        terminalPersonId: entry.terminalPersonId,
                        iin: entry.iin,
                        displayName: entry.displayName,
                        userType: entry.userType,
                        userStatus: entry.userStatus,
                        authority: entry.authority,
                        validFrom: entry.validFrom,
                        validTo: entry.validTo,
                        cardNo: entry.cardNo,
                        cardName: entry.cardName,
                        sourceSummary: entry.sourceSummary,
                        linkedPersonId: linkedPerson?.id ?? null,
                        linkedPersonName: linkedPerson ? formatImportPersonName(linkedPerson) : null,
                        linkedPersonIin: linkedPerson?.iin ?? null,
                        isPresentInLastSync: entry.isPresentInLastSync,
                        lastSeenAt: entry.lastSeenAt.toISOString(),
                        stateReason: !entry.isPresentInLastSync
                            ? "stale"
                            : !entry.iin
                                ? "missing_iin"
                                : linkedPerson
                                    ? "linked"
                                    : "unlinked"
                    };
                });

                groups.push({
                    groupKey,
                    status,
                    iin,
                    displayName:
                        groupEntries.find((entry) => entry.displayName)?.displayName ??
                        (suggestedPerson ? formatImportPersonName(suggestedPerson) : null),
                    suggestedPersonId: suggestedPerson?.id ?? null,
                    suggestedPersonName: suggestedPerson ? formatImportPersonName(suggestedPerson) : null,
                    suggestedPersonIin: suggestedPerson?.iin ?? null,
                    warnings,
                    entries: itemEntries
                });
            }

            const filteredGroups = groups
                .filter((group) => !query.status || query.status.length === 0 || query.status.includes(group.status))
                .sort((left, right) => left.groupKey.localeCompare(right.groupKey));
            const pagedGroups = filteredGroups.slice(query.offset, query.offset + query.limit);

            return {
                groups: pagedGroups,
                page: {
                    limit: query.limit,
                    offset: query.offset,
                    total: filteredGroups.length
                },
                summary
            } satisfies ListPersonsImportCandidatesResultDto;
        }
    };
}
