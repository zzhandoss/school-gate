import type { DeviceDb } from "@school-gate/device/device-db/drizzle";

type RepoFactory<T> = (db: DeviceDb) => T;

export type DeviceUnitOfWork<TDeps> = {
    run<T>(cb: (deps: TDeps) => T): T;
};

function isPromiseLike(value: unknown): value is Promise<unknown> {
    if (typeof value !== "object" || value === null) return false;
    return "then" in value && typeof (value as { then?: unknown }).then === "function";
}

function guardNoAsync<T>(value: T): T {
    if (typeof value !== "object" || value === null) return value;

    const target = value as Record<string, unknown>;
    return new Proxy(target, {
        get(proxyTarget, prop, receiver) {
            const current = Reflect.get(proxyTarget, prop, receiver);
            if (typeof current !== "function") return current;
            return (...args: unknown[]) => {
                const result = current.apply(proxyTarget, args);
                if (isPromiseLike(result)) {
                    throw new Error("Async operation in transaction is not allowed.");
                }
                return result;
            };
        }
    }) as T;
}

export function createDeviceUnitOfWork<TDeps>(
    db: DeviceDb,
    factories: { [K in keyof TDeps]: RepoFactory<TDeps[K]> }
): DeviceUnitOfWork<TDeps> {
    return {
        run<T>(cb: (deps: TDeps) => T): T {
            return db.transaction((tx) => {
                const deps = Object.fromEntries(
                    Object.entries(factories).map(([key, factory]) => [
                        key,
                        guardNoAsync((factory as RepoFactory<unknown>)(tx as unknown as DeviceDb))
                    ])
                ) as TDeps;

                const result = cb(deps);
                if (isPromiseLike(result)) {
                    throw new Error("Async operation in transaction is not allowed.");
                }
                return result;
            });
        }
    };
}
