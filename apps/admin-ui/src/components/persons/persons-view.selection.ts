import { useMemo, useState } from "react";

import {
    getSelectedVisiblePersonIds,
    toggleAllVisiblePersons,
    toggleSelectedPerson
} from "./persons-selection";
import type { PersonItem } from "@/lib/persons/types";

export function usePersonsViewSelection(persons: Array<PersonItem>) {
    const [selectedPersonIds, setSelectedPersonIds] = useState<Record<string, boolean>>({});
    const visiblePersonIds = useMemo(() => persons.map((person) => person.id), [persons]);
    const selectedVisibleIds = useMemo(
        () => getSelectedVisiblePersonIds(visiblePersonIds, selectedPersonIds),
        [selectedPersonIds, visiblePersonIds]
    );
    const selectedVisiblePersons = useMemo(
        () => persons.filter((person) => selectedVisibleIds.includes(person.id)),
        [persons, selectedVisibleIds]
    );
    const allVisibleSelected = persons.length > 0 && selectedVisibleIds.length === persons.length;
    const someVisibleSelected = selectedVisibleIds.length > 0 && !allVisibleSelected;

    function onToggleSelected(personId: string, checked: boolean) {
        setSelectedPersonIds((previous) => toggleSelectedPerson(previous, personId, checked));
    }

    function onToggleAllVisible(checked: boolean) {
        setSelectedPersonIds(toggleAllVisiblePersons(visiblePersonIds, checked));
    }

    return {
        selectedPersonIds,
        setSelectedPersonIds,
        selectedVisibleIds,
        selectedVisiblePersons,
        allVisibleSelected,
        someVisibleSelected,
        onToggleSelected,
        onToggleAllVisible
    };
}
