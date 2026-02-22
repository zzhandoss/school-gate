const togglePattern = /^sub:(on|off):(.+)$/;

export function formatSubscriptionToggleCallbackData(input: {
    subscriptionId: string;
    isActive: boolean;
}): string {
    return `sub:${input.isActive ? "on" : "off"}:${input.subscriptionId}`;
}

export function parseSubscriptionToggleCallbackData(data: string): {
    subscriptionId: string;
    isActive: boolean;
} | null {
    const match = togglePattern.exec(data);
    if (!match) return null;

    return {
        isActive: match[1] === "on",
        subscriptionId: match[2] as string
    };
}
