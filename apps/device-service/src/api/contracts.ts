import { z } from "zod";

export const adapterRegisterSchema = z.object({
    vendorKey: z.string().min(1),
    instanceKey: z.string().min(1).optional(),
    instanceName: z.string().min(1).optional(),
    version: z.string().min(1).optional(),
    baseUrl: z.string().min(1),
    retentionMs: z.number().int().positive(),
    capabilities: z.array(z.string()).optional(),
    deviceSettingsSchema: z.record(z.string(), z.unknown()).optional(),
});

export type AdapterRegisterInput = z.infer<typeof adapterRegisterSchema>;

export const adapterHeartbeatSchema = z.object({
    adapterId: z.string().min(1),
});

export type AdapterHeartbeatInput = z.infer<typeof adapterHeartbeatSchema>;

export const adapterEventsSchema = z.object({
    adapterId: z.string().min(1),
    events: z.array(
        z.object({
            deviceId: z.string().min(1),
            eventId: z.string().min(1),
            direction: z.enum(["IN", "OUT"]),
            occurredAt: z.number().int().positive(),
            terminalPersonId: z.string().min(1).nullable().optional(),
            rawPayload: z.string().nullable().optional(),
        })
    ),
});

export type AdapterEventsInput = z.infer<typeof adapterEventsSchema>;
