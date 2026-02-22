import type { AdminsService } from "../../services/admins.types.js";
import type { AuthStrategy, EmailPasswordAuthInput } from "./authStrategy.types.js";

export function createEmailPasswordStrategy(deps: {
    adminsService: AdminsService;
}): AuthStrategy {
    return {
        id: "email_password",
        async authenticate(input: EmailPasswordAuthInput) {
            const result = await deps.adminsService.login({
                email: input.email,
                password: input.password,
            });
            if (!result) {
                return null;
            }
            return { admin: result.admin };
        },
    };
}
