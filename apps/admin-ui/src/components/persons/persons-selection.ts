export function getSelectedVisiblePersonIds(
    visiblePersonIds: Array<string>,
    selectedPersonIds: Record<string, boolean>
) {
    return visiblePersonIds.filter((personId) => selectedPersonIds[personId]);
}

export function toggleSelectedPerson(
    selectedPersonIds: Record<string, boolean>,
    personId: string,
    checked: boolean
) {
    if (checked) {
        return {
            ...selectedPersonIds,
            [personId]: true
        };
    }

    const next = { ...selectedPersonIds };
    delete next[personId];
    return next;
}

export function toggleAllVisiblePersons(
    visiblePersonIds: Array<string>,
    checked: boolean
) {
    if (!checked) {
        return {};
    }

    return Object.fromEntries(visiblePersonIds.map((personId) => [personId, true]));
}
