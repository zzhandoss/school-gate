import type { DeviceAdapterClient } from "../ports/deviceAdapterClient.js";
import type { DeviceCursorsRepo } from "../repos/deviceCursors.repo.js";
import type {
    RecordDeviceAccessEventInput,
    RecordDeviceAccessEventResult,
} from "./recordAccessEvent.js";

export type BackfillDeviceEventsInput = {
    deviceId: string;
    limit: number;
};

export type BackfillDeviceEventsResult = {
    fetched: number;
    inserted: number;
    duplicates: number;
    lastEventId: string | null;
};

type RecordAccessEvent = (input: RecordDeviceAccessEventInput) => RecordDeviceAccessEventResult;

export function createBackfillDeviceEventsUC(deps: {
    adapterClient: DeviceAdapterClient;
    deviceCursorsRepo: DeviceCursorsRepo;
    recordAccessEvent: RecordAccessEvent;
}) {
    return async function backfillDeviceEvents(
        input: BackfillDeviceEventsInput
    ): Promise<BackfillDeviceEventsResult> {
        const cursor = deps.deviceCursorsRepo.getByDeviceId(input.deviceId);
        const events = await deps.adapterClient.fetchEvents({
            deviceId: input.deviceId,
            sinceEventId: cursor?.lastAckedEventId ?? null,
            limit: input.limit,
        });

        let inserted = 0;
        let duplicates = 0;

        for (const event of events) {
            const result = deps.recordAccessEvent({
                deviceId: event.deviceId,
                eventId: event.eventId,
                direction: event.direction,
                occurredAt: event.occurredAt,
                terminalPersonId: event.terminalPersonId ?? null,
                rawPayload: event.rawPayload ?? null,
            });

            if (result.result === "inserted") {
                inserted++;
            } else {
                duplicates++;
            }
        }

        const lastEventId = events.length > 0 ? events[events.length - 1]!.eventId : null;
        return {
            fetched: events.length,
            inserted,
            duplicates,
            lastEventId,
        };
    };
}
