import type { RuleEvaluator } from "./evaluator.types.js";

export function parseDeviceServiceDownConfig(_raw: unknown) {
    return {};
}

type DeviceServiceDownConfig = ReturnType<typeof parseDeviceServiceDownConfig>;

export const evaluateDeviceServiceDownRule: RuleEvaluator<"device_service_down", DeviceServiceDownConfig> = ({
    context,
}) => {
    const component =
        context.snapshot.components.find((item) => item.componentId === "device-service") ?? null;
    const condition = !component || component.status === "down" || context.snapshot.deviceService === null;
    return {
        condition,
        triggeredMessage: "device-service health check is down",
        resolvedMessage: "device-service health check is ok",
        details: {
            componentStatus: component?.status ?? "down",
            error: component?.error ?? null,
            deviceServicePresent: context.snapshot.deviceService !== null,
        },
    };
};
