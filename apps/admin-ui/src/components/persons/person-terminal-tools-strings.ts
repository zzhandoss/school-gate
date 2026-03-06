export type PersonTerminalToolsStrings = {
    attachButton: string
    attachTitle: string
    attachDescription: string
    loadCandidates: string
    loadingCandidates: string
    loadFailed: string
    selectedCount: string
    applySelected: string
    applyingSelected: string
    applyFailed: string
    noCandidates: string
    noActionable: string
    attachAction: string
    reassignAction: string
    alreadyLinked: string
    unavailable: string
    linkedTo: string
    syncTitle: string
    syncDescription: string
    createOnDevices: string
    updateLinked: string
    updatingLinked: string
    updateFailed: string
    createDialogTitle: string
    createDialogDescription: string
    updateDialogTitle: string
    updateDialogDescription: string
    terminalPersonIdLabel: string
    terminalPersonIdHint: string
    validFromLabel: string
    validToLabel: string
    createSelected: string
    creating: string
    createFailed: string
    noAvailableDevices: string
    resultSummary: string
    confirmCreateTitle: string
    confirmCreateDescription: string
    confirmUpdateTitle: string
    confirmUpdateDescription: string
    confirmFieldsTitle: string
    confirmDevicesTitle: string
    confirmWarningTitle: string
    confirmCreateWarningDescription: string
    confirmUpdateWarningDescription: string
    confirmCreateAction: string
    confirmUpdateAction: string
    notSet: string
    nameLabel: string
    displayNameLabel: string
    citizenIdNoLabel: string
    userTypeLabel: string
    userStatusLabel: string
    authorityLabel: string
    useIin: string
    terminalUserSectionTitle: string
    terminalUserSectionDescription: string
    validitySectionTitle: string
    validitySectionDescription: string
    cardSectionTitle: string
    cardSectionDescription: string
    devicesSectionTitle: string
    devicesSectionCreateDescription: string
    devicesSectionUpdateDescription: string
    cardNoLabel: string
    cardNameLabel: string
    cardNamePlaceholder: string
    cardTypeLabel: string
    cardStatusLabel: string
    loadingSnapshot: string
    snapshotWarningTitle: string
    snapshotMissingWarning: string
    snapshotMismatchWarning: string
    updateFace: string
    updatingFace: string
    faceDialogTitle: string
    faceDialogDescription: string
    faceSectionTitle: string
    faceSectionDescription: string
    selectFaceLabel: string
    replaceFace: string
    facePreviewAlt: string
    facePreviewTitle: string
    facePersonTitle: string
    noFaceSelected: string
    faceDevicesDescription: string
    faceConfirmTitle: string
    faceConfirmDescription: string
    faceConfirmAction: string
    faceConfirmWarningDescription: string
    faceUploadFailed: string
    faceUpdateFailed: string
    faceFileHint: string
};

const en: PersonTerminalToolsStrings = {
    attachButton: "Attach terminal records",
    attachTitle: "Attach terminal records",
    attachDescription: "Review imported terminal records for this person and attach or move links in bulk.",
    loadCandidates: "Reload records",
    loadingCandidates: "Loading records…",
    loadFailed: "Failed to load terminal records.",
    selectedCount: "Selected: {{count}}",
    applySelected: "Apply selected",
    applyingSelected: "Applying…",
    applyFailed: "Failed to apply selected terminal records.",
    noCandidates: "No imported terminal records are available for this person.",
    noActionable: "No actionable terminal records are selected.",
    attachAction: "Attach",
    reassignAction: "Move link",
    alreadyLinked: "Already linked",
    unavailable: "Unavailable",
    linkedTo: "Linked to {{value}}",
    syncTitle: "Terminal write tools",
    syncDescription: "Create missing terminal users on selected devices or update linked terminal users with current person data.",
    createOnDevices: "Add to terminals",
    updateLinked: "Update terminals",
    updatingLinked: "Updating terminals…",
    updateFailed: "Failed to update linked terminal users.",
    createDialogTitle: "Prepare terminal user creation",
    createDialogDescription: "Choose target terminals and confirm the fields that will be written before creating terminal users.",
    updateDialogTitle: "Review terminal user update",
    updateDialogDescription: "Loaded terminal fields can be reviewed and changed before updating linked terminal users.",
    terminalPersonIdLabel: "Terminal user ID",
    terminalPersonIdHint: "Used as the terminal-side person identifier when creating a user.",
    validFromLabel: "Valid from",
    validToLabel: "Valid to",
    createSelected: "Review before create",
    creating: "Creating terminal users…",
    createFailed: "Failed to create terminal users.",
    noAvailableDevices: "No enabled terminals are available for creation.",
    resultSummary: "Successful: {{success}} • Failed: {{failed}}",
    confirmCreateTitle: "Confirm terminal user creation",
    confirmCreateDescription: "Review the fields that will be written to selected terminals before creating terminal users.",
    confirmUpdateTitle: "Confirm terminal user update",
    confirmUpdateDescription: "Review the fields that will be written to linked terminals before updating terminal users.",
    confirmFieldsTitle: "Fields to write",
    confirmDevicesTitle: "Target terminals",
    confirmWarningTitle: "This action writes directly to terminal records.",
    confirmCreateWarningDescription: "Selected terminals will receive a new terminal user with the fields listed below.",
    confirmUpdateWarningDescription: "Linked terminal users will be updated with the fields listed below on every selected terminal.",
    confirmCreateAction: "Confirm creation",
    confirmUpdateAction: "Confirm update",
    notSet: "Not set",
    nameLabel: "Name",
    displayNameLabel: "Display name",
    citizenIdNoLabel: "IIN",
    userTypeLabel: "User type",
    userStatusLabel: "User status",
    authorityLabel: "Authority",
    useIin: "Use IIN",
    terminalUserSectionTitle: "Terminal user",
    terminalUserSectionDescription: "Core terminal-side person fields that identify and authorize the user.",
    validitySectionTitle: "Validity",
    validitySectionDescription: "Choose the access time window that should be written to the selected terminals.",
    cardSectionTitle: "Access card",
    cardSectionDescription: "Optional card data that can be written together with the terminal user.",
    devicesSectionTitle: "Target terminals",
    devicesSectionCreateDescription: "Choose the terminals where a new terminal user should be created.",
    devicesSectionUpdateDescription: "The update will be sent to every linked terminal listed below.",
    cardNoLabel: "Card number",
    cardNameLabel: "Card name",
    cardNamePlaceholder: "Main card",
    cardTypeLabel: "Card type",
    cardStatusLabel: "Card status",
    loadingSnapshot: "Loading terminal data…",
    snapshotWarningTitle: "Terminal snapshot warnings",
    snapshotMissingWarning: "{{count}} linked terminal(s) have no snapshot data, so the form is prefilled from the available records only.",
    snapshotMismatchWarning: "Terminal records differ between linked devices. Review the prefilled values before saving.",
    updateFace: "Update face",
    updatingFace: "Updating face…",
    faceDialogTitle: "Update terminal face photo",
    faceDialogDescription: "Upload one face photo and choose the linked terminals that should receive it.",
    faceSectionTitle: "Face photo",
    faceSectionDescription: "The uploaded photo will be sent to every selected linked terminal.",
    selectFaceLabel: "Select photo",
    replaceFace: "Replace photo",
    facePreviewAlt: "Face preview",
    facePreviewTitle: "Preview",
    facePersonTitle: "Person",
    noFaceSelected: "No face photo selected yet.",
    faceDevicesDescription: "Choose linked terminals that should receive the uploaded face photo.",
    faceConfirmTitle: "Confirm terminal face update",
    faceConfirmDescription: "Review the selected terminals before writing the new face photo.",
    faceConfirmAction: "Confirm face update",
    faceConfirmWarningDescription: "This action updates the face data on each selected linked terminal and keeps the current terminal fields from snapshot data.",
    faceUploadFailed: "Failed to read the selected image.",
    faceUpdateFailed: "Failed to update face data on linked terminals.",
    faceFileHint: "Use a clear JPG or PNG portrait. The image will be converted and sent as terminal face data."
};

const ru: PersonTerminalToolsStrings = {
    attachButton: "Привязать записи терминалов",
    attachTitle: "Привязка записей терминалов",
    attachDescription: "Проверьте импортированные записи терминалов для этой персоны и массово привяжите или перенесите связи.",
    loadCandidates: "Обновить записи",
    loadingCandidates: "Загрузка записей…",
    loadFailed: "Не удалось загрузить записи терминалов.",
    selectedCount: "Выбрано: {{count}}",
    applySelected: "Применить выбранное",
    applyingSelected: "Применение…",
    applyFailed: "Не удалось применить выбранные записи терминалов.",
    noCandidates: "Для этой персоны нет импортированных записей терминалов.",
    noActionable: "Нет выбранных записей, к которым можно применить действие.",
    attachAction: "Привязать",
    reassignAction: "Перенести связь",
    alreadyLinked: "Уже привязано",
    unavailable: "Недоступно",
    linkedTo: "Привязано к {{value}}",
    syncTitle: "Запись в терминалы",
    syncDescription: "Создавайте недостающих пользователей терминала на выбранных устройствах или обновляйте уже связанные записи текущими данными персоны.",
    createOnDevices: "Добавить в терминалы",
    updateLinked: "Обновить в терминалах",
    updatingLinked: "Обновление терминалов…",
    updateFailed: "Не удалось обновить связанные записи терминалов.",
    createDialogTitle: "Подготовка создания пользователя терминала",
    createDialogDescription: "Выберите терминалы назначения и проверьте поля, которые будут записаны перед созданием пользователя терминала.",
    updateDialogTitle: "Проверьте обновление пользователя терминала",
    updateDialogDescription: "Загруженные поля терминала можно проверить и изменить перед обновлением связанных записей.",
    terminalPersonIdLabel: "ID пользователя терминала",
    terminalPersonIdHint: "Используется как идентификатор персоны на стороне терминала при создании записи.",
    validFromLabel: "Действует с",
    validToLabel: "Действует до",
    createSelected: "Проверить перед созданием",
    creating: "Создание пользователей терминала…",
    createFailed: "Не удалось создать пользователей терминала.",
    noAvailableDevices: "Нет включённых терминалов, доступных для создания.",
    resultSummary: "Успешно: {{success}} • С ошибками: {{failed}}",
    confirmCreateTitle: "Подтвердите создание пользователя терминала",
    confirmCreateDescription: "Проверьте поля, которые будут записаны на выбранные терминалы перед созданием пользователей терминала.",
    confirmUpdateTitle: "Подтвердите обновление пользователя терминала",
    confirmUpdateDescription: "Проверьте поля, которые будут записаны на связанные терминалы перед обновлением пользователей терминала.",
    confirmFieldsTitle: "Поля для записи",
    confirmDevicesTitle: "Целевые терминалы",
    confirmWarningTitle: "Это действие напрямую изменяет записи терминалов.",
    confirmCreateWarningDescription: "На выбранных терминалах будет создан новый пользователь с перечисленными ниже полями.",
    confirmUpdateWarningDescription: "На каждом выбранном терминале будут обновлены связанные записи пользователя перечисленными ниже полями.",
    confirmCreateAction: "Подтвердить создание",
    confirmUpdateAction: "Подтвердить обновление",
    notSet: "Не задано",
    nameLabel: "ФИО",
    displayNameLabel: "Отображаемое имя",
    citizenIdNoLabel: "ИИН",
    userTypeLabel: "Тип пользователя",
    userStatusLabel: "Статус пользователя",
    authorityLabel: "Уровень доступа",
    useIin: "Взять ИИН",
    terminalUserSectionTitle: "Пользователь терминала",
    terminalUserSectionDescription: "Основные поля терминала, которые определяют идентификатор и права доступа пользователя.",
    validitySectionTitle: "Срок действия",
    validitySectionDescription: "Укажите период доступа, который будет записан на выбранные терминалы.",
    cardSectionTitle: "Карта доступа",
    cardSectionDescription: "Дополнительные данные карты, которые можно записать вместе с пользователем терминала.",
    devicesSectionTitle: "Целевые терминалы",
    devicesSectionCreateDescription: "Выберите терминалы, на которых нужно создать нового пользователя.",
    devicesSectionUpdateDescription: "Обновление будет отправлено на все связанные терминалы из списка ниже.",
    cardNoLabel: "Номер карты",
    cardNameLabel: "Название карты",
    cardNamePlaceholder: "Основная карта",
    cardTypeLabel: "Тип карты",
    cardStatusLabel: "Статус карты",
    loadingSnapshot: "Загрузка данных терминала…",
    snapshotWarningTitle: "Предупреждения по snapshot терминалов",
    snapshotMissingWarning: "Для {{count}} связанных терминалов нет snapshot-данных, поэтому форма предзаполнена только по доступным записям.",
    snapshotMismatchWarning: "Связанные терминалы содержат разные значения. Проверьте предзаполненные поля перед сохранением.",
    updateFace: "Обновить фото",
    updatingFace: "Обновление фото…",
    faceDialogTitle: "Обновление фото лица на терминалах",
    faceDialogDescription: "Загрузите одну фотографию лица и выберите связанные терминалы, на которые её нужно записать.",
    faceSectionTitle: "Фото лица",
    faceSectionDescription: "Загруженная фотография будет отправлена на каждый выбранный связанный терминал.",
    selectFaceLabel: "Выбрать фото",
    replaceFace: "Заменить фото",
    facePreviewAlt: "Предпросмотр фото лица",
    facePreviewTitle: "Предпросмотр",
    facePersonTitle: "Персона",
    noFaceSelected: "Фото лица пока не выбрано.",
    faceDevicesDescription: "Выберите связанные терминалы, которые должны получить загруженную фотографию лица.",
    faceConfirmTitle: "Подтвердите обновление фото лица",
    faceConfirmDescription: "Проверьте выбранные терминалы перед записью новой фотографии лица.",
    faceConfirmAction: "Подтвердить обновление фото",
    faceConfirmWarningDescription: "Это действие обновит данные лица на каждом выбранном связанном терминале и сохранит текущие поля пользователя из snapshot-данных.",
    faceUploadFailed: "Не удалось прочитать выбранное изображение.",
    faceUpdateFailed: "Не удалось обновить данные лица на связанных терминалах.",
    faceFileHint: "Используйте чёткий портрет в JPG или PNG. Изображение будет преобразовано и отправлено как face data терминала."
};

const kz: PersonTerminalToolsStrings = {
    attachButton: "Терминал жазбаларын байланыстыру",
    attachTitle: "Терминал жазбаларын байланыстыру",
    attachDescription: "Осы адамға қатысты импортталған терминал жазбаларын қарап, байланыстарды жаппай байланыстырыңыз немесе ауыстырыңыз.",
    loadCandidates: "Жазбаларды жаңарту",
    loadingCandidates: "Жазбалар жүктелуде…",
    loadFailed: "Терминал жазбаларын жүктеу мүмкін болмады.",
    selectedCount: "Таңдалды: {{count}}",
    applySelected: "Таңдалғанын қолдану",
    applyingSelected: "Қолданылып жатыр…",
    applyFailed: "Таңдалған терминал жазбаларын қолдану мүмкін болмады.",
    noCandidates: "Бұл адам үшін импортталған терминал жазбалары жоқ.",
    noActionable: "Әрекет жасауға болатын таңдалған жазбалар жоқ.",
    attachAction: "Байланыстыру",
    reassignAction: "Байланысты ауыстыру",
    alreadyLinked: "Бұрыннан байланысқан",
    unavailable: "Қолжетімсіз",
    linkedTo: "{{value}} тұлғасына байланысқан",
    syncTitle: "Терминалға жазу",
    syncDescription: "Таңдалған құрылғыларда жетіспейтін терминал пайдаланушыларын құрыңыз немесе байланысқан терминал жазбаларын ағымдағы адам деректерімен жаңартыңыз.",
    createOnDevices: "Терминалдарға қосу",
    updateLinked: "Терминалдарды жаңарту",
    updatingLinked: "Терминалдар жаңартылуда…",
    updateFailed: "Байланысқан терминал жазбаларын жаңарту мүмкін болмады.",
    createDialogTitle: "Терминал пайдаланушысын құруға дайындық",
    createDialogDescription: "Мақсатты терминалдарды таңдап, пайдаланушыны құрмас бұрын жазылатын өрістерді тексеріңіз.",
    updateDialogTitle: "Терминал пайдаланушысын жаңартуды тексеру",
    updateDialogDescription: "Жүктелген терминал өрістерін байланысқан жазбаларды жаңартпас бұрын қарап, өзгертуге болады.",
    terminalPersonIdLabel: "Терминал пайдаланушысының ID",
    terminalPersonIdHint: "Жазба құрылған кезде терминал жағындағы тұлға идентификаторы ретінде қолданылады.",
    validFromLabel: "Басталу күні",
    validToLabel: "Аяқталу күні",
    createSelected: "Құру алдында тексеру",
    creating: "Терминал пайдаланушылары құрылуда…",
    createFailed: "Терминал пайдаланушыларын құру мүмкін болмады.",
    noAvailableDevices: "Құруға қолжетімді қосулы терминалдар жоқ.",
    resultSummary: "Сәтті: {{success}} • Қате: {{failed}}",
    confirmCreateTitle: "Терминал пайдаланушысын құруды растаңыз",
    confirmCreateDescription: "Терминал пайдаланушыларын құрмас бұрын таңдалған терминалдарға жазылатын өрістерді тексеріңіз.",
    confirmUpdateTitle: "Терминал пайдаланушысын жаңартуды растаңыз",
    confirmUpdateDescription: "Терминал пайдаланушыларын жаңартпас бұрын байланысқан терминалдарға жазылатын өрістерді тексеріңіз.",
    confirmFieldsTitle: "Жазылатын өрістер",
    confirmDevicesTitle: "Мақсатты терминалдар",
    confirmWarningTitle: "Бұл әрекет терминал жазбаларын тікелей өзгертеді.",
    confirmCreateWarningDescription: "Таңдалған терминалдарда төменде көрсетілген өрістермен жаңа пайдаланушы құрылады.",
    confirmUpdateWarningDescription: "Әр таңдалған терминалда байланысқан пайдаланушы жазбалары төмендегі өрістермен жаңартылады.",
    confirmCreateAction: "Құруды растау",
    confirmUpdateAction: "Жаңартуды растау",
    notSet: "Орнатылмаған",
    nameLabel: "Аты-жөні",
    displayNameLabel: "Көрсетілетін атау",
    citizenIdNoLabel: "ЖСН",
    userTypeLabel: "Пайдаланушы түрі",
    userStatusLabel: "Пайдаланушы күйі",
    authorityLabel: "Рұқсат деңгейі",
    useIin: "ЖСН пайдалану",
    terminalUserSectionTitle: "Терминал пайдаланушысы",
    terminalUserSectionDescription: "Пайдаланушының терминалдағы идентификаторы мен рұқсаттарын анықтайтын негізгі өрістер.",
    validitySectionTitle: "Жарамдылық мерзімі",
    validitySectionDescription: "Таңдалған терминалдарға жазылатын қолжетімділік уақыт аралығын көрсетіңіз.",
    cardSectionTitle: "Қолжетімділік картасы",
    cardSectionDescription: "Терминал пайдаланушысымен бірге жазылатын қосымша карта деректері.",
    devicesSectionTitle: "Мақсатты терминалдар",
    devicesSectionCreateDescription: "Жаңа терминал пайдаланушысын құру керек терминалдарды таңдаңыз.",
    devicesSectionUpdateDescription: "Жаңарту төмендегі барлық байланысқан терминалдарға жіберіледі.",
    cardNoLabel: "Карта нөмірі",
    cardNameLabel: "Карта атауы",
    cardNamePlaceholder: "Негізгі карта",
    cardTypeLabel: "Карта түрі",
    cardStatusLabel: "Карта күйі",
    loadingSnapshot: "Терминал деректері жүктелуде…",
    snapshotWarningTitle: "Терминал snapshot ескертулері",
    snapshotMissingWarning: "{{count}} байланысқан терминал үшін snapshot деректері жоқ, сондықтан форма тек қолжетімді жазбалармен толтырылды.",
    snapshotMismatchWarning: "Байланысқан терминалдардағы мәндер әртүрлі. Сақтау алдында толтырылған өрістерді тексеріңіз.",
    updateFace: "Бет суретін жаңарту",
    updatingFace: "Бет суреті жаңартылуда…",
    faceDialogTitle: "Терминалдағы бет суретін жаңарту",
    faceDialogDescription: "Бір бет суретін жүктеп, оны алуы тиіс байланысқан терминалдарды таңдаңыз.",
    faceSectionTitle: "Бет суреті",
    faceSectionDescription: "Жүктелген сурет әр таңдалған байланысқан терминалға жіберіледі.",
    selectFaceLabel: "Суретті таңдау",
    replaceFace: "Суретті ауыстыру",
    facePreviewAlt: "Бет суретінің алдын ала көрінісі",
    facePreviewTitle: "Алдын ала қарау",
    facePersonTitle: "Тұлға",
    noFaceSelected: "Бет суреті әлі таңдалмаған.",
    faceDevicesDescription: "Жүктелген бет суретін алуы тиіс байланысқан терминалдарды таңдаңыз.",
    faceConfirmTitle: "Бет суретін жаңартуды растаңыз",
    faceConfirmDescription: "Жаңа бет суретін жазбас бұрын таңдалған терминалдарды тексеріңіз.",
    faceConfirmAction: "Бет суретін жаңартуды растау",
    faceConfirmWarningDescription: "Бұл әрекет әр таңдалған байланысқан терминалдағы бет деректерін жаңартады және snapshot деректерінен алынған ағымдағы өрістерді сақтайды.",
    faceUploadFailed: "Таңдалған суретті оқу мүмкін болмады.",
    faceUpdateFailed: "Байланысқан терминалдардағы бет деректерін жаңарту мүмкін болмады.",
    faceFileHint: "Айқын JPG немесе PNG портретін пайдаланыңыз. Сурет түрлендіріліп, терминалдың face data ретінде жіберіледі."
};

export function getPersonTerminalToolsStrings(language: string): PersonTerminalToolsStrings {
    if (language === "ru") {
        return ru;
    }
    if (language === "kz") {
        return kz;
    }
    return en;
}
