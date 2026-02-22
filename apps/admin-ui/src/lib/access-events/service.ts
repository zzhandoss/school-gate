import type {
    ListAccessEventsInput,
    ListAccessEventsResult,
    MapTerminalIdentityInput,
    MapTerminalIdentityResult,
    PersonDeviceIdentity,
    PersonLookupItem,
    UnmatchedAccessEventItem
} from "./types";
import { requestApi } from "@/lib/api/client";

type ListUnmatchedResponse = {
    events: Array<UnmatchedAccessEventItem>
};

type SearchPersonsResponse = {
    persons: Array<PersonLookupItem>
};

type ListPersonIdentitiesResponse = {
    identities: Array<PersonDeviceIdentity>
};

export async function listUnmatchedAccessEvents(limit = 100) {
    const query = new URLSearchParams({ limit: String(limit) });
    const response = await requestApi<ListUnmatchedResponse>(`/api/access-events/unmatched?${query.toString()}`);
    return response.events;
}

export async function listAccessEvents(input: ListAccessEventsInput): Promise<ListAccessEventsResult> {
    const query = new URLSearchParams({
        limit: String(input.limit),
        offset: String(input.offset)
    });

    if (input.status) query.set("status", input.status);
    if (input.direction) query.set("direction", input.direction);
    if (input.deviceId) query.set("deviceId", input.deviceId);
    if (input.iin) query.set("iin", input.iin);
    if (input.terminalPersonId) query.set("terminalPersonId", input.terminalPersonId);
    if (input.from) query.set("from", input.from);
    if (input.to) query.set("to", input.to);

    return requestApi<ListAccessEventsResult>(`/api/access-events?${query.toString()}`);
}

export async function mapTerminalIdentity(input: MapTerminalIdentityInput) {
    return requestApi<MapTerminalIdentityResult>("/api/access-events/mappings", {
        method: "POST",
        body: input
    });
}

export async function searchPersonsByIin(iin: string, limit = 20) {
    const query = new URLSearchParams({
        iin,
        limit: String(limit)
    });
    const response = await requestApi<SearchPersonsResponse>(`/api/persons?${query.toString()}`);
    return response.persons;
}

export async function listPersonIdentities(personId: string) {
    const response = await requestApi<ListPersonIdentitiesResponse>(`/api/persons/${personId}/identities`);
    return response.identities;
}
