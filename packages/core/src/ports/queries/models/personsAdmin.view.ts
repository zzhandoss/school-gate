export type PersonAdminView = {
    id: string;
    iin: string;
    terminalPersonId: string | null;
    hasDeviceIdentities: boolean;
    firstName: string | null;
    lastName: string | null;
    createdAt: Date;
};
