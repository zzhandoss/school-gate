import type { AdminsService } from "../../services/admins.types.js";
import type { PasswordHasher } from "../../../ports/passwordHasher.js";
import { normalizeEmail } from "../../../utils/normalizeEmail.js";
import { AdminDisabledError } from "../../../utils/errors.js";

type Deps = {
    adminsService: AdminsService;
    passwordHasher: PasswordHasher;
};

export function createAdminLoginFlow(deps: Deps) {
    return async (input: { email: string; password: string }) => {
        const email = normalizeEmail(input.email);
        const admin = await deps.adminsService.getByEmail(email);

        if (!admin) {
            await deps.passwordHasher.verify(deps.passwordHasher.dummyHash, input.password);
            return null;
        }

        const isValid = await deps.passwordHasher.verify(admin.passwordHash, input.password);
        if (!isValid) {
            return null;
        }

        if (admin.status !== "active") {
            throw new AdminDisabledError();
        }

        return { admin };
    };
}
