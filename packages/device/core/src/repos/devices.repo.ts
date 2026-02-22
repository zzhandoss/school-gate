export type DeviceDirection = "IN" | "OUT";

export type Device = {
    id: string;
    name: string | null;
    direction: DeviceDirection;
    adapterKey: string;
    settingsJson: string | null;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export interface DevicesRepo {
    upsert(input: {
        id: string;
        name: string | null;
        direction: DeviceDirection;
        adapterKey: string;
        settingsJson?: string | null;
        enabled: boolean;
        createdAt: Date;
        updatedAt: Date;
    }): void;
    getById(id: string): Device | null;
    list(): Device[];
    listByAdapterKey(adapterKey: string): Device[];
    setEnabled(input: { id: string; enabled: boolean; updatedAt: Date }): boolean;
    delete(id: string): boolean;
}
