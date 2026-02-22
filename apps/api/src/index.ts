import { serve } from "@hono/node-server";
import { createApiComposition } from "./composition/createApiComposition.js";
import { createHttpApp } from "./delivery/http/createHttpApp.js";
import { createRuntime } from "./runtime/createRuntime.js";

const runtime = createRuntime();
const app = createHttpApp(createApiComposition(runtime));

const close = () => {
    runtime.close();
};

process.on("SIGINT", close);
process.on("SIGTERM", close);

serve(
    {
        fetch: app.fetch,
        port: runtime.apiConfig.port
    },
    (info) => {
        runtime.logger.info({ port: info.port }, "api server started");
    }
);
