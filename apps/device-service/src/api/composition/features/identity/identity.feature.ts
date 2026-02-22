import {
    deviceServiceIdentityFindResultSchema,
    type DeviceServiceIdentityFindDto,
    type DeviceServiceIdentityFindResultDto
} from "@school-gate/contracts";

export type IdentityModule = {
    find: (input: DeviceServiceIdentityFindDto) => Promise<DeviceServiceIdentityFindResultDto>;
};

export function createIdentityModule(input: {
    find: (payload: DeviceServiceIdentityFindDto) => Promise<DeviceServiceIdentityFindResultDto>;
}): IdentityModule {
    return {
        async find(payload) {
            const limit = payload.limit && payload.limit > 0 ? payload.limit : 1;
            return deviceServiceIdentityFindResultSchema.parse(
                await input.find({
                    identityKey: payload.identityKey,
                    identityValue: payload.identityValue,
                    ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
                    limit
                })
            );
        }
    };
}
