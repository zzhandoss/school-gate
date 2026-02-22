import { DeviceDomainEvents } from "../events/domain.js";
import type { DeviceEventsRepo } from "../repos/deviceEvents.repo.js";
import type { DeviceOutboxRepo } from "../repos/deviceOutbox.repo.js";
import type { DeviceDirection } from "../repos/devices.repo.js";

type IdGenerator = { nextId(): string };

export type RecordDeviceAccessEventInput = {
    deviceId: string;
    eventId: string;
    direction: DeviceDirection;
    occurredAt: Date;
    terminalPersonId?: string | null;
    rawPayload?: string | null;
};

export type RecordDeviceAccessEventResult = {
    result: "inserted" | "duplicate";
    deviceEventId: string | null;
};

export type RecordDeviceAccessEventTx = {
    run<T>(cb: (deps: { deviceEventsRepo: DeviceEventsRepo; deviceOutboxRepo: DeviceOutboxRepo }) => T): T;
};

export function createRecordDeviceAccessEventUC(deps: {
    tx: RecordDeviceAccessEventTx;
    idGen: IdGenerator;
}) {
    return function recordAccessEvent(
        input: RecordDeviceAccessEventInput
    ): RecordDeviceAccessEventResult {
        return deps.tx.run(({ deviceEventsRepo, deviceOutboxRepo }) => {
            const deviceEventId = deps.idGen.nextId();
            const result = deviceEventsRepo.insertIdempotent({
                id: deviceEventId,
                deviceId: input.deviceId,
                eventId: input.eventId,
                direction: input.direction,
                occurredAt: input.occurredAt,
                terminalPersonId: input.terminalPersonId ?? null,
                rawPayload: input.rawPayload ?? null,
            });

            if (result === "duplicate") {
                return { result, deviceEventId: null };
            }

            deviceOutboxRepo.enqueue({
                id: deps.idGen.nextId(),
                event: {
                    type: DeviceDomainEvents.ACCESS_EVENT_INGEST,
                    payload: {
                        eventId: input.eventId,
                        deviceId: input.deviceId,
                        direction: input.direction,
                        occurredAt: input.occurredAt.getTime(),
                        terminalPersonId: input.terminalPersonId ?? null,
                        rawPayload: input.rawPayload ?? null,
                    },
                },
            });

            return { result, deviceEventId };
        });
    };
}
