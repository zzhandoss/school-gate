type PersonsRouteSearch = {
    limit: number
    iin: string
    query: string
    linkedStatus: "all" | "linked" | "unlinked"
    includeDeviceIds: string
    excludeDeviceIds: string
};

export function parseCsvFilterValue(value: string) {
    return Array.from(
        new Set(
            value
                .split(",")
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
        )
    );
}

export function stringifyCsvFilterValue(values: Array<string>) {
    return Array.from(
        new Set(values.map((item) => item.trim()).filter((item) => item.length > 0))
    ).join(",");
}

export function countAppliedPersonsFilters(search: PersonsRouteSearch) {
    return [
        search.iin.trim().length > 0,
        search.query.trim().length > 0,
        search.linkedStatus !== "all",
        parseCsvFilterValue(search.includeDeviceIds).length > 0,
        parseCsvFilterValue(search.excludeDeviceIds).length > 0,
        search.limit !== 20
    ].filter(Boolean).length;
}
