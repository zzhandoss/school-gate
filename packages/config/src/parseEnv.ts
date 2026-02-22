import type { z } from "zod";

function formatIssues(issues: z.ZodIssue[]): string {
    return issues
        .map((issue) => {
            const path = issue.path.join(".") || "env";
            return `${path}: ${issue.message}`;
        })
        .join("; ");
}

export function parseEnv<T>(schema: z.ZodType<T>, label: string): T {
    const result = schema.safeParse(process.env);
    if (!result.success) {
        throw new Error(`Invalid ${label} config: ${formatIssues(result.error.issues)}`);
    }
    return result.data;
}

