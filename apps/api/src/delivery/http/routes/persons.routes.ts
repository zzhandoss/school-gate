import { OpenAPIHono } from "@hono/zod-openapi";
import type { ApiEnv } from "../context.js";
import type { AdminAuth } from "../middleware/adminAuth.js";
import {
    registerPersonsCrudRoutes,
    registerPersonsIdentityRoutes,
    registerPersonsImportRoutes,
    registerPersonsListRoutes,
    registerPersonsTerminalUserRoutes
} from "./persons/index.js";
import type { PersonsModule } from "./persons/persons.types.js";

export type { PersonsModule } from "./persons/persons.types.js";

export function createPersonsRoutes(input: { module: PersonsModule; auth: AdminAuth }) {
    const app = new OpenAPIHono<ApiEnv>();
    app.use("*", input.auth.verify);

    registerPersonsListRoutes(app, input);
    registerPersonsImportRoutes(app, input);
    registerPersonsTerminalUserRoutes(app, input);
    registerPersonsCrudRoutes(app, input);
    registerPersonsIdentityRoutes(app, input);

    return app;
}
