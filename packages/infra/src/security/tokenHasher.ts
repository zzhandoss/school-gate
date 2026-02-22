import crypto from "node:crypto";
import type { TokenHasher } from "@school-gate/core";

export function createTokenHasher(): TokenHasher {
    return {
        hash(token: string) {
            return crypto.createHash("sha256").update(token).digest("hex");
        },
    };
}
