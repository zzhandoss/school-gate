import type { PersonImportCandidateStatus } from "@/lib/persons/types";

export type PersonsImportStrings = {
    title: string
    subtitle: string
    sync: string
    syncing: string
    backToRegistry: string
    searchPlaceholder: string
    devicePlaceholder: string
    allDevices: string
    includeStale: string
    includeCards: string
    pageSize: string
    actionableOnly: string
    noEligibleDevices: string
    selectAllDevices: string
    selectDeviceLabel: string
    deviceNameLabel: string
    deviceIdLabel: string
    adapterLabel: string
    directionLabel: string
    enabledLabel: string
    createdLabel: string
    enabledValue: string
    disabledValue: string
    selectedDevicesSummary: string
    loadFailedTitle: string
    loadFailedDescription: string
    applyFailedTitle: string
    syncFailedTitle: string
    syncCompleted: string
    selectedDevices: string
    suggestedAction: string
    terminalUsers: string
    warnings: string
    linkedPerson: string
    devices: string
    details: string
    stale: string
    lastSeen: string
    source: string
    statusLabel: string
    card: string
    validity: string
    emptyTitle: string
    emptyDescription: string
    noRowsSelected: string
    runSummary: string
    applySummary: string
    statusLabels: Record<PersonImportCandidateStatus, string>
    actionLabels: {
        create: string
        link: string
        reassign: string
        skip: string
    }
};

const en: PersonsImportStrings = {
    title: "Import terminal users",
    subtitle: "Sync users from selected devices, review matches, then create or link persons in bulk.",
    sync: "Sync terminal users",
    syncing: "Syncing...",
    backToRegistry: "Back to persons",
    searchPlaceholder: "Search IIN, terminal user, terminal ID, card",
    devicePlaceholder: "Filter by device",
    allDevices: "All eligible devices",
    includeStale: "Show stale records",
    includeCards: "Load cards",
    pageSize: "Batch size",
    actionableOnly: "Actionable only",
    noEligibleDevices: "No enabled devices were found for import.",
    selectAllDevices: "Select all devices",
    selectDeviceLabel: "Select device",
    deviceNameLabel: "Device",
    deviceIdLabel: "Device ID",
    adapterLabel: "Adapter",
    directionLabel: "Direction",
    enabledLabel: "State",
    createdLabel: "Created",
    enabledValue: "Enabled",
    disabledValue: "Disabled",
    selectedDevicesSummary: "Selected {{selected}} of {{total}} devices",
    loadFailedTitle: "Import workspace failed to load",
    loadFailedDescription: "Cannot load terminal users or devices.",
    applyFailedTitle: "Bulk apply failed",
    syncFailedTitle: "Sync failed",
    syncCompleted: "Last sync",
    selectedDevices: "Selected devices",
    suggestedAction: "Suggested action",
    terminalUsers: "Terminal users",
    warnings: "Warnings",
    linkedPerson: "Linked person",
    devices: "Devices",
    details: "Details",
    stale: "Stale",
    lastSeen: "Last seen",
    source: "Source",
    statusLabel: "Status",
    card: "Card",
    validity: "Validity",
    emptyTitle: "No terminal users found",
    emptyDescription: "Run sync for devices or adjust filters.",
    noRowsSelected: "Select at least one row.",
    runSummary: "{{processed}}/{{devices}} devices, {{entries}} users, {{errors}} errors",
    applySummary: "Applied {{applied}} of {{total}} operations. Conflicts: {{conflicts}}, errors: {{errors}}.",
    statusLabels: {
        ready_create: "Ready to create",
        ready_link: "Ready to link",
        already_linked: "Already linked",
        conflict: "Conflict",
        missing_iin: "Missing IIN",
        stale_terminal_record: "Stale terminal record"
    },
    actionLabels: {
        create: "Create persons",
        link: "Link to existing",
        reassign: "Move links",
        skip: "Skip selected"
    }
};

const ru: PersonsImportStrings = {
    title: "Импорт пользователей терминалов",
    subtitle: "Загрузите пользователей с выбранных устройств, проверьте совпадения и пачкой создайте или привяжите персон.",
    sync: "Синхронизировать пользователей",
    syncing: "Синхронизация...",
    backToRegistry: "Назад к персонам",
    searchPlaceholder: "Поиск по ИИН, имени, terminal ID, карте",
    devicePlaceholder: "Фильтр по устройству",
    allDevices: "Все доступные устройства",
    includeStale: "Показывать устаревшие записи",
    includeCards: "Загружать карты",
    pageSize: "Размер пачки",
    actionableOnly: "Только требующие действия",
    noEligibleDevices: "Не найдено включенных устройств для импорта.",
    selectAllDevices: "Выбрать все устройства",
    selectDeviceLabel: "Выбрать устройство",
    deviceNameLabel: "Устройство",
    deviceIdLabel: "Device ID",
    adapterLabel: "Адаптер",
    directionLabel: "Направление",
    enabledLabel: "Состояние",
    createdLabel: "Создано",
    enabledValue: "Включено",
    disabledValue: "Выключено",
    selectedDevicesSummary: "Выбрано {{selected}} из {{total}} устройств",
    loadFailedTitle: "Не удалось загрузить рабочую область импорта",
    loadFailedDescription: "Не удалось загрузить пользователей терминалов или список устройств.",
    applyFailedTitle: "Не удалось применить массовое действие",
    syncFailedTitle: "Не удалось выполнить синхронизацию",
    syncCompleted: "Последняя синхронизация",
    selectedDevices: "Выбранные устройства",
    suggestedAction: "Рекомендуемое действие",
    terminalUsers: "Пользователи терминалов",
    warnings: "Предупреждения",
    linkedPerson: "Связанная персона",
    devices: "Устройства",
    details: "Детали",
    stale: "Устарело",
    lastSeen: "Последнее появление",
    source: "Источник",
    statusLabel: "Статус",
    card: "Карта",
    validity: "Срок действия",
    emptyTitle: "Пользователи терминалов не найдены",
    emptyDescription: "Запустите синхронизацию или измените фильтры.",
    noRowsSelected: "Выберите хотя бы одну строку.",
    runSummary: "{{processed}}/{{devices}} устройств, {{entries}} пользователей, {{errors}} ошибок",
    applySummary: "Применено {{applied}} из {{total}} операций. Конфликты: {{conflicts}}, ошибки: {{errors}}.",
    statusLabels: {
        ready_create: "Готово к созданию",
        ready_link: "Готово к привязке",
        already_linked: "Уже привязано",
        conflict: "Конфликт",
        missing_iin: "Нет ИИН",
        stale_terminal_record: "Устаревшая запись"
    },
    actionLabels: {
        create: "Создать персон",
        link: "Привязать к существующим",
        reassign: "Перенести связи",
        skip: "Пропустить выбранное"
    }
};

export function getPersonsImportStrings(language: string) {
    return language.startsWith("ru") ? ru : en;
}
