export const DeviceDomainEvents = {
    ACCESS_EVENT_INGEST: "access_event.ingest",
} as const;

export type DeviceDomainEventType = (typeof DeviceDomainEvents)[keyof typeof DeviceDomainEvents];
