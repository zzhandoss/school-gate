import type { PreprocessPendingRequestsDeps, PreprocessPendingRequestsUC, PreprocessResult } from "./preprocessPendingRequests.types.js";

export function createPreprocessPendingRequestsUC(
    deps: PreprocessPendingRequestsDeps
): PreprocessPendingRequestsUC {
    return async function preprocess(input): Promise<PreprocessResult> {
        const items = await deps.subscriptionRequestsService.listPendingNew({ limit: input.limit });

        let ready = 0;
        let needsPerson = 0;
        let errors = 0;

        for (const req of items) {
            try {
                const existing = await deps.personsService.getByIin(req.iin);
                if (existing) {
                    await deps.subscriptionRequestsService.markReadyForReview({
                        id: req.id,
                        personId: existing.id,
                        resolvedAt: deps.clock.now()
                    });
                    ready++;
                    continue;
                }

                if (!deps.flags.autoResolvePersonByIin) {
                    await deps.subscriptionRequestsService.markNeedsPerson({
                        id: req.id,
                        message: "Person not found. Admin must create person manually.",
                        resolvedAt: deps.clock.now()
                    });
                    needsPerson++;
                    continue;
                }

                const r = await deps.personResolver.resolveByIin({ iin: req.iin });

                if (r.kind === "found") {
                    const personId = deps.idGen.nextId();

                    await deps.personsService.create({
                        id: personId,
                        iin: req.iin,
                        firstName: r.firstName ?? null,
                        lastName: r.lastName ?? null
                    });

                    for (const m of r.mappings ?? []) {
                        if (!m?.deviceId || !m?.terminalPersonId) continue;

                        await deps.personTerminalIdentitiesService.upsert({
                            id: deps.idGen.nextId(),
                            personId,
                            deviceId: m.deviceId,
                            terminalPersonId: m.terminalPersonId
                        });
                    }

                    await deps.subscriptionRequestsService.markReadyForReview({
                        id: req.id,
                        personId,
                        resolvedAt: deps.clock.now()
                    });

                    ready++;
                    continue;
                }

                if (r.kind === "not_found") {
                    await deps.subscriptionRequestsService.markNeedsPerson({
                        id: req.id,
                        message: "Person not found in device. Admin must create person or reject request.",
                        resolvedAt: deps.clock.now()
                    });
                    needsPerson++;
                    continue;
                }

                await deps.subscriptionRequestsService.markNeedsPerson({
                    id: req.id,
                    message: `Auto-resolve error: ${r.message}`,
                    resolvedAt: deps.clock.now()
                });
                errors++;
            } catch (e: any) {
                errors++;

                await deps.subscriptionRequestsService.markNeedsPerson({
                    id: req.id,
                    message: `Preprocess failed: ${String(e?.message ?? e)}`,
                    resolvedAt: deps.clock.now()
                });
            }
        }

        return { processed: items.length, ready, needsPerson, errors };
    };
}
