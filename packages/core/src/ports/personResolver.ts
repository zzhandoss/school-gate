export type DeviceMapping = {
    terminalPersonId?: string;
    deviceId: string;
}

export type ResolvePersonResult =
    | {
        kind: "found";
        firstName?: string | null;
        lastName?: string | null;
        mappings: DeviceMapping[];
      }
    | { kind: "not_found" }
    | { kind: "error"; message: string };

export interface PersonResolver {
    resolveByIin(input: { iin: string }): Promise<ResolvePersonResult>;
}
