import {
    deviceServiceIdentityExportUsersResultSchema,
    deviceServiceIdentityExportUsersSchema,
    type DeviceServiceIdentityExportUsersDto,
    type DeviceServiceIdentityExportUsersResultDto,
    deviceServiceIdentityBulkCreateUsersResultSchema,
    deviceServiceIdentityBulkCreateUsersSchema,
    type DeviceServiceIdentityBulkCreateUsersDto,
    type DeviceServiceIdentityBulkCreateUsersResultDto,
    deviceServiceIdentityGetUserPhotoResultSchema,
    deviceServiceIdentityGetUserPhotoSchema,
    type DeviceServiceIdentityGetUserPhotoDto,
    type DeviceServiceIdentityGetUserPhotoResultDto,
    deviceServiceIdentityWriteUsersResultSchema,
    deviceServiceIdentityWriteUsersSchema,
    type DeviceServiceIdentityWriteUsersDto,
    type DeviceServiceIdentityWriteUsersResultDto,
    deviceServiceIdentityFindResultSchema,
    type DeviceServiceIdentityFindDto,
    type DeviceServiceIdentityFindResultDto
} from "@school-gate/contracts";

export type IdentityModule = {
    find: (input: DeviceServiceIdentityFindDto) => Promise<DeviceServiceIdentityFindResultDto>;
    exportUsers: (input: DeviceServiceIdentityExportUsersDto) => Promise<DeviceServiceIdentityExportUsersResultDto>;
    bulkCreateUsers: (input: DeviceServiceIdentityBulkCreateUsersDto) => Promise<DeviceServiceIdentityBulkCreateUsersResultDto>;
    getUserPhoto: (input: DeviceServiceIdentityGetUserPhotoDto) => Promise<DeviceServiceIdentityGetUserPhotoResultDto>;
    createUsers: (input: DeviceServiceIdentityWriteUsersDto) => Promise<DeviceServiceIdentityWriteUsersResultDto>;
    updateUsers: (input: DeviceServiceIdentityWriteUsersDto) => Promise<DeviceServiceIdentityWriteUsersResultDto>;
};

export function createIdentityModule(input: {
    find: (payload: DeviceServiceIdentityFindDto) => Promise<DeviceServiceIdentityFindResultDto>;
    exportUsers: (payload: DeviceServiceIdentityExportUsersDto) => Promise<DeviceServiceIdentityExportUsersResultDto>;
    bulkCreateUsers: (payload: DeviceServiceIdentityBulkCreateUsersDto) => Promise<DeviceServiceIdentityBulkCreateUsersResultDto>;
    getUserPhoto: (payload: DeviceServiceIdentityGetUserPhotoDto) => Promise<DeviceServiceIdentityGetUserPhotoResultDto>;
    createUsers: (payload: DeviceServiceIdentityWriteUsersDto) => Promise<DeviceServiceIdentityWriteUsersResultDto>;
    updateUsers: (payload: DeviceServiceIdentityWriteUsersDto) => Promise<DeviceServiceIdentityWriteUsersResultDto>;
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
        },
        async exportUsers(payload) {
            const parsed = deviceServiceIdentityExportUsersSchema.parse(payload);
            return deviceServiceIdentityExportUsersResultSchema.parse(await input.exportUsers(parsed));
        },
        async bulkCreateUsers(payload) {
            const parsed = deviceServiceIdentityBulkCreateUsersSchema.parse(payload);
            return deviceServiceIdentityBulkCreateUsersResultSchema.parse(await input.bulkCreateUsers(parsed));
        },
        async getUserPhoto(payload) {
            const parsed = deviceServiceIdentityGetUserPhotoSchema.parse(payload);
            return deviceServiceIdentityGetUserPhotoResultSchema.parse(await input.getUserPhoto(parsed));
        },
        async createUsers(payload) {
            const parsed = deviceServiceIdentityWriteUsersSchema.parse(payload);
            return deviceServiceIdentityWriteUsersResultSchema.parse(await input.createUsers(parsed));
        },
        async updateUsers(payload) {
            const parsed = deviceServiceIdentityWriteUsersSchema.parse(payload);
            return deviceServiceIdentityWriteUsersResultSchema.parse(await input.updateUsers(parsed));
        }
    };
}
