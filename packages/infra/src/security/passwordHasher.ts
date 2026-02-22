import argon2 from "argon2";
import type { PasswordHasher } from "@school-gate/core";

const DUMMY_HASH =
    "$argon2id$v=19$m=65536,t=3,p=4$g+PmZwVcuyN3JAw6Or4kRQ$Hf7WevmK9hTHtSp/dxzU+4rloTWBWa7If7XrIUsf2/I";

export function createArgon2PasswordHasher(): PasswordHasher {
    return {
        dummyHash: DUMMY_HASH,
        hash(password) {
            return argon2.hash(password, { type: argon2.argon2id });
        },
        verify(hash, password) {
            return argon2.verify(hash, password);
        }
    };
}
