type PersonsTerminalToolsStrings = {
    attachTitle: string
    attachDescription: string
    attachButton: string
    attaching: string
    noAttachCandidates: string
    linkedState: string
    moveLink: string
    attachLink: string
    alreadyLinked: string
    syncTitle: string
    syncDescription: string
    updateLinked: string
    updatingLinked: string
    createOnDevices: string
    creatingOnDevices: string
    terminalPersonId: string
    targetDevices: string
    save: string
    close: string
    successTemplate: string
};

const en: PersonsTerminalToolsStrings = {
    attachTitle: "Attach terminal records",
    attachDescription: "Use imported terminal users that already match this person by IIN.",
    attachButton: "Attach terminal records",
    attaching: "Applying...",
    noAttachCandidates: "No compatible terminal records found in the latest import snapshot.",
    linkedState: "Current owner",
    moveLink: "Move link here",
    attachLink: "Attach here",
    alreadyLinked: "Already linked",
    syncTitle: "Terminal sync",
    syncDescription: "Push current person data to linked or selected terminals.",
    updateLinked: "Update linked terminals",
    updatingLinked: "Updating...",
    createOnDevices: "Create on terminals",
    creatingOnDevices: "Creating...",
    terminalPersonId: "Terminal user ID",
    targetDevices: "Target devices",
    save: "Save",
    close: "Close",
    successTemplate: "Success {{success}} / {{total}}"
};

const ru: PersonsTerminalToolsStrings = {
    attachTitle: "Привязать записи терминалов",
    attachDescription: "Используйте уже импортированные записи терминалов, совпадающие с этой персоной по ИИН.",
    attachButton: "Привязать записи терминалов",
    attaching: "Применение...",
    noAttachCandidates: "Совместимые записи терминалов в текущем snapshot не найдены.",
    linkedState: "Текущий владелец",
    moveLink: "Перенести сюда",
    attachLink: "Привязать",
    alreadyLinked: "Уже привязано",
    syncTitle: "Синхронизация с терминалами",
    syncDescription: "Отправьте текущие данные персоны на связанные или выбранные терминалы.",
    updateLinked: "Обновить связанные терминалы",
    updatingLinked: "Обновление...",
    createOnDevices: "Создать на терминалах",
    creatingOnDevices: "Создание...",
    terminalPersonId: "ID пользователя на терминале",
    targetDevices: "Целевые устройства",
    save: "Сохранить",
    close: "Закрыть",
    successTemplate: "Успешно {{success}} / {{total}}"
};

export function getPersonsTerminalToolsStrings(language: string) {
    return language.startsWith("ru") ? ru : en;
}
