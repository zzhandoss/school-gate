import type { PersonsModule } from "../../../apps/api/src/delivery/http/routes/persons.routes.js";

export function createEmptyPersonsModule(): PersonsModule {
    return {
        list: async ({ limit, offset }) => ({
            persons: [],
            page: {
                limit,
                offset,
                total: 0
            }
        }),
        searchByIin: async () => []
    };
}
