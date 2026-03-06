import type { DeviceServiceGatewayModule } from "../../../delivery/http/routes/deviceServiceGateway.routes.js";

type ExportedUser = {
    deviceId: string;
    terminalPersonId: string;
    displayName?: string | null | undefined;
    userType?: string | null | undefined;
    userStatus?: string | null | undefined;
    authority?: string | null | undefined;
    citizenIdNo?: string | null | undefined;
    validFrom?: string | null | undefined;
    validTo?: string | null | undefined;
    cardNo?: string | null | undefined;
    cardName?: string | null | undefined;
    sourceSummary?: string[] | undefined;
    rawUserPayload?: string | null | undefined;
    rawCardPayload?: string | null | undefined;
};

export type ImportRunDeviceSummary = {
    deviceId: string;
    exportedCount: number;
    failed: boolean;
    hasMore: boolean;
    errorCode?: string | null;
    errorMessage?: string | null;
};

export async function collectImportRunDeviceUsers(input: {
    deviceId: string;
    pageSize: number;
    includeCards: boolean;
    authorizationHeader: string | undefined;
    deviceServiceGateway: Pick<DeviceServiceGatewayModule, "exportUsers">;
}): Promise<{ users: ExportedUser[]; summary: ImportRunDeviceSummary }> {
    let offset = 0;
    let hasMore = true;
    let failed = false;
    let exportedForDevice = 0;
    const collectedUsers: ExportedUser[] = [];
    let lastErrorCode: string | null = null;
    let lastErrorMessage: string | null = null;

    while (hasMore && !failed) {
        try {
            const exported = await input.deviceServiceGateway.exportUsers({
                payload: {
                    target: { mode: "device", deviceId: input.deviceId },
                    view: "grouped",
                    limit: input.pageSize,
                    offset,
                    includeCards: input.includeCards
                },
                authorizationHeader: input.authorizationHeader,
                admin: undefined
            });

            if (exported.view !== "grouped") {
                failed = true;
                lastErrorCode = "identity_export_failed";
                lastErrorMessage = "Device export returned unexpected flat view";
                break;
            }

            const deviceResult = exported.devices.find((item) => item.deviceId === input.deviceId);
            if (!deviceResult) {
                failed = true;
                lastErrorCode = "identity_export_failed";
                lastErrorMessage = "Device export result was not returned";
                break;
            }

            if (deviceResult.failed) {
                failed = true;
                lastErrorCode = deviceResult.errorCode ?? "identity_export_failed";
                lastErrorMessage = deviceResult.errorMessage ?? "Device export failed";
                break;
            }

            exportedForDevice += deviceResult.users.length;
            collectedUsers.push(...deviceResult.users);
            hasMore = deviceResult.hasMore;
            offset += input.pageSize;
        } catch (error) {
            failed = true;
            lastErrorCode = "identity_export_failed";
            lastErrorMessage = error instanceof Error ? error.message : String(error);
        }
    }

    return {
        users: collectedUsers,
        summary: {
            deviceId: input.deviceId,
            exportedCount: exportedForDevice,
            failed,
            hasMore: false,
            errorCode: lastErrorCode,
            errorMessage: lastErrorMessage
        }
    };
}
