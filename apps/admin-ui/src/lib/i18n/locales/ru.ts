export const ruCommon = {
    app: {
        brand: {
            schoolGate: "School Gate",
            adminUi: "Админ-панель"
        },
        nav: {
            main: "Основное",
            monitoring: "Мониторинг",
            administration: "Администрирование",
            deviceOperations: "Устройства",
            dashboard: "Дашборд",
            subscriptionRequests: "Запросы на подписку",
            accessEvents: "События прохода",
            persons: "Персоны",
            alerts: "Алерты",
            auditLogs: "Аудит-логи",
            settings: "Настройки",
            import: "Импорт",
            admins: "Админы",
            roles: "Роли",
            devices: "Девайсы",
            adapters: "Адаптеры",
            dsMonitoring: "DS Мониторинг",
            profile: "Профиль"
        },
        shell: {
            signedInAs: "Вы вошли как",
            role: "Роль",
            operationsOverview: "Операционный обзор",
            openMenu: "Открыть меню",
            closeMenu: "Закрыть меню",
            expandSidebar: "Развернуть боковую панель",
            collapseSidebar: "Свернуть боковую панель",
            breadcrumb: "Хлебные крошки",
            language: "Язык",
            signOut: "Выйти",
            signingOut: "Выход...",
            goBack: "Назад"
        },
        language: {
            title: "Язык интерфейса",
            description: "Выберите язык подписей и сообщений в админ-панели.",
            ru: "Русский",
            en: "Английский",
            kz: "Казахский"
        }
    },
    settings: {
        accessDeniedTitle: "Доступ запрещен",
        accessDeniedDescription: "У вашей учетной записи нет разрешения `settings.read`.",
        loadFailedTitle: "Не удалось загрузить настройки",
        runtimeTitle: "Runtime-настройки",
        runtimeDescription: "Управляйте интервалами опроса, ретеншеном, мониторингом и уведомлениями по секциям.",
        writable: "Можно изменять",
        readOnly: "Только чтение",
        refreshTab: "Обновить вкладку",
        sectionUpdated: "Секция обновлена.",
        loadFailed: "Не удалось загрузить настройки",
        saveFailed: "Не удалось сохранить секцию",
        changed: "Изменено",
        clean: "Без изменений",
        enabled: "Включено",
        disabled: "Выключено",
        saveFailedTitle: "Ошибка сохранения",
        savedTitle: "Сохранено",
        resetSection: "Сбросить секцию",
        saving: "Сохранение...",
        saveSection: "Сохранить секцию",
        meta: {
            effective: "effective",
            db: "db",
            env: "env",
            updated: "updated",
            notOverridden: "не переопределено",
            never: "никогда"
        },
        groups: {
            worker: {
                title: "Воркер",
                description: "Параметры опроса и пакетной обработки основного воркера.",
                fields: {
                    pollMs: {
                        label: "Опрос (мс)",
                        hint: "Интервал между циклами опроса."
                    },
                    batch: {
                        label: "Размер батча",
                        hint: "Количество элементов за цикл."
                    },
                    autoResolvePersonByIin: {
                        label: "Автоопределение по ИИН",
                        hint: "Включает автоматическое сопоставление личности по ИИН."
                    }
                }
            },
            outbox: {
                title: "Outbox",
                description: "Повторы доставки и стратегия lease для outbox-событий.",
                fields: {
                    pollMs: {
                        label: "Опрос (мс)",
                        hint: "Интервал опроса outbox."
                    },
                    batch: {
                        label: "Размер батча",
                        hint: "Количество строк за цикл."
                    },
                    maxAttempts: {
                        label: "Макс. попыток",
                        hint: "Количество повторов до постоянной ошибки."
                    },
                    leaseMs: {
                        label: "Lease (мс)",
                        hint: "Таймаут lease при обработке."
                    },
                    processingBy: {
                        label: "Обрабатывает",
                        hint: "Идентификатор воркера-владельца."
                    }
                }
            },
            accessEvents: {
                title: "События доступа",
                description: "Поведение очереди обработки событий доступа.",
                fields: {
                    pollMs: {
                        label: "Опрос (мс)",
                        hint: "Интервал опроса очереди событий."
                    },
                    batch: {
                        label: "Размер батча",
                        hint: "Количество событий за цикл."
                    },
                    retryDelayMs: {
                        label: "Задержка повтора (мс)",
                        hint: "Пауза перед повторной обработкой неуспешных событий."
                    },
                    leaseMs: {
                        label: "Lease (мс)",
                        hint: "Таймаут lease при обработке."
                    },
                    maxAttempts: {
                        label: "Макс. попыток",
                        hint: "Количество повторов до постоянной ошибки."
                    },
                    processingBy: {
                        label: "Обрабатывает",
                        hint: "Идентификатор воркера-владельца."
                    }
                }
            },
            retention: {
                title: "Ретеншен",
                description: "Расписание очистки и окна хранения данных.",
                fields: {
                    pollMs: {
                        label: "Опрос (мс)",
                        hint: "Интервал запуска очистки."
                    },
                    batch: {
                        label: "Размер батча",
                        hint: "Количество удаляемых строк за цикл."
                    },
                    accessEventsDays: {
                        label: "События доступа (дни)",
                        hint: "Срок хранения событий доступа."
                    },
                    auditLogsDays: {
                        label: "Аудит-логи (дни)",
                        hint: "Срок хранения аудит-логов."
                    }
                }
            },
            monitoring: {
                title: "Мониторинг",
                description: "Пороги актуальности heartbeat воркера.",
                fields: {
                    workerTtlMs: {
                        label: "TTL воркера (мс)",
                        hint: "Порог, после которого воркер считается устаревшим."
                    }
                }
            },
            notifications: {
                title: "Уведомления",
                description: "Шаблон уведомлений и пороги их актуальности.",
                fields: {
                    parentTemplate: {
                        label: "Шаблон для родителя",
                        hint: "Шаблон, используемый для уведомлений родителя."
                    },
                    parentMaxAgeMs: {
                        label: "Макс. возраст для родителя (мс)",
                        hint: "Не отправлять родительские уведомления старше этого порога."
                    },
                    alertMaxAgeMs: {
                        label: "Макс. возраст алерта (мс)",
                        hint: "Не отправлять алерты старше этого порога."
                    }
                }
            }
        },
        validation: {
            positiveInteger: "{{field}} должно быть положительным целым числом.",
            required: "{{field}} не может быть пустым."
        }
    },
    common: {
        actions: {
            refresh: "Обновить",
            refreshing: "Обновление...",
            reset: "Сбросить",
            applyFilters: "Применить фильтры",
            close: "Закрыть",
            cancel: "Отмена",
            search: "Поиск",
            searching: "Поиск...",
            create: "Создать",
            creating: "Создание...",
            map: "Сопоставить идентификатор",
            mapping: "Сопоставление...",
            resolve: "Определить персону",
            resolving: "Разрешение...",
            approveRequest: "Одобрить запрос",
            rejectRequest: "Отклонить запрос",
            showFilters: "Показать фильтры",
            hideFilters: "Скрыть фильтры"
        },
        selected: "выбрано",
        filters: {
            title: "Фильтры",
            appliedCount: "Применено: {{count}}",
            noFilters: "Без фильтров",
            pageSize: "Размер страницы",
            status: "Статус",
            direction: "Направление",
            resolution: "Разрешение",
            order: "Сортировка"
        },
        pagination: {
            range: "{{from}}-{{to}} из {{total}}",
            perPage_one: "{{count}} на страницу",
            perPage_few: "{{count}} на страницу",
            perPage_many: "{{count}} на страницу",
            perPage_other: "{{count}} на страницу"
        },
        labels: {
            iin: "ИИН",
            telegram: "Telegram",
            personId: "ID персоны",
            requestId: "ID запроса",
            currentStatus: "Текущий статус",
            eventId: "ID события",
            device: "Устройство",
            created: "Создано",
            actions: "Действия",
            name: "Имя",
            adapter: "Адаптер",
            instance: "Инстанс",
            vendor: "Вендор",
            mode: "Режим",
            ttl: "TTL",
            lastSeen: "Последний heartbeat",
            lastEvent: "Последнее событие",
            outbox: "Outbox",
            resolution: "Разрешение",
            status: "Статус",
            direction: "Направление",
            terminal: "Терминал",
            id: "id",
            firstName: "Имя",
            lastName: "Фамилия"
        },
        placeholders: {
            email: "admin@example.com",
            displayName: "Ваше отображаемое имя",
            searchAdapter: "Поиск адаптера",
            searchDevice: "Поиск устройства",
            searchIinPrefix: "12-символьный ИИН или префикс",
            personUuid: "UUID персоны",
            terminalPersonId: "ID персоны в терминале",
            optional: "Необязательно",
            actorId: "ID актера",
            auditAction: "Действие",
            entityType: "Тип сущности",
            entityId: "ID сущности"
        },
        empty: {
            noRequestsForFilter: "По текущим фильтрам запросов нет.",
            noAdapterTelemetry: "Телеметрия адаптеров пока отсутствует.",
            noDeviceTelemetry: "Телеметрия устройств пока отсутствует.",
            noPersonsByIin: "По этому запросу ИИН персоны не найдены",
            noSearchResults: "Нет результатов.",
            noMatches: "Совпадений не найдено."
        }
    },
    ui: {
        close: "Закрыть",
        toggleSidebar: "Переключить боковую панель",
        pagination: {
            navigation: "Пагинация",
            previous: "Назад",
            previousAria: "Перейти на предыдущую страницу",
            next: "Вперед",
            nextAria: "Перейти на следующую страницу",
            morePages: "Больше страниц"
        }
    },
    validation: {
        emailInvalid: "Введите корректный email",
        passwordRequired: "Пароль обязателен",
        confirmPasswordRequired: "Подтвердите пароль",
        nameTooLong: "Имя слишком длинное",
        passwordsDoNotMatch: "Пароли не совпадают",
        telegramCodeInvalid: "Введите 6-значный код"
    },
    auth: {
        common: {
            password: "Пароль",
            confirmPassword: "Подтвердите пароль",
            nameOptional: "Имя (необязательно)",
            backToSignIn: "Назад ко входу",
            goToSignIn: "Перейти ко входу"
        },
        login: {
            title: "Вход администратора",
            subtitle: "Используйте пароль или Telegram OTP для входа в операционный дашборд.",
            methods: {
                password: "Пароль",
                telegram: "Telegram"
            },
            forgotPassword: "Забыли пароль?",
            signIn: "Войти",
            signingIn: "Вход...",
            sendingCode: "Отправка кода...",
            sendCodeToTelegram: "Отправить код в Telegram",
            telegramCode: "6-значный код",
            codeExpiresAt: "Код действует до {{value}}.",
            changeEmail: "Изменить email",
            resendCode: "Отправить код повторно",
            verifying: "Проверка...",
            telegramLoginTitle: "Вход через Telegram",
            authFailedTitle: "Ошибка аутентификации",
            notice: {
                codeSent: "Код отправлен в привязанный Telegram. Введите 6 цифр для продолжения."
            },
            errors: {
                unexpectedLogin: "Непредвиденная ошибка при входе",
                unexpectedRequestTelegram: "Непредвиденная ошибка при запросе кода Telegram",
                unexpectedTelegramLogin: "Непредвиденная ошибка при входе через Telegram"
            },
            hero: {
                protected: "Защищенный доступ администратора",
                title: "Операционный центр School Gate",
                description: "Контролируйте воркеры, очереди и входящие запросы на подписку из одной панели."
            }
        },
        firstAdmin: {
            title: "Инициализация первого администратора",
            subtitle: "Используйте один раз для первоначального доступа в пустой системе.",
            create: "Создать первого администратора",
            creating: "Создание администратора...",
            bootstrapFailedTitle: "Ошибка инициализации",
            placeholders: {
                email: "root@example.com"
            },
            hero: {
                oneTimeSetup: "Одноразовая настройка",
                title: "Первый администратор получает доступ super admin",
                description: "После успешной инициализации вы автоматически входите и переходите в дашборд.",
                emptySystemsOnly: "Доступно только для пустых систем",
                strongCredentials: "Используйте надежные учетные данные для продакшена"
            }
        },
        invite: {
            missingTitle: "Инвайт-ссылка отсутствует",
            missingDescription: "Токен инвайта не найден в URL. Запросите новую ссылку у администратора.",
            title: "Завершение регистрации по инвайту",
            subtitle: "Завершите настройку аккаунта и сразу перейдите в дашборд.",
            complete: "Завершить регистрацию",
            completing: "Завершение регистрации...",
            registrationFailedTitle: "Ошибка регистрации",
            hero: {
                onboarding: "Подключение по инвайту",
                title: "Остался один шаг до доступа к админ-консоли",
                description: "После регистрации система автоматически выполнит вход и откроет дашборд.",
                validated: "Токен инвайта уже проверяется при отправке"
            }
        },
        passwordResetRequest: {
            title: "Запрос сброса пароля",
            subtitle: "Введите admin email. Если аккаунт существует, будет выпущен токен сброса.",
            send: "Отправить запрос на сброс",
            sending: "Отправка запроса...",
            requestFailedTitle: "Ошибка запроса",
            requestAcceptedTitle: "Запрос принят",
            requestAcceptedDescription: "Если аккаунт существует, токен сброса уже активен.",
            devTokenPrefix: "Dev-токен:",
            openConfirmPage: "открыть страницу подтверждения",
            hero: {
                recovery: "Восстановление аккаунта",
                title: "Восстановите доступ администратора",
                description: "Ссылки сброса одноразовые и автоматически истекают.",
                emailHint: "Используйте только доверенный admin email"
            }
        },
        passwordResetConfirm: {
            missingTitle: "Токен сброса отсутствует",
            missingDescription: "Откройте страницу из корректной ссылки сброса или запросите новый токен.",
            requestNewToken: "Запросить новый токен сброса",
            title: "Установите новый пароль",
            subtitle: "Выберите новый пароль администратора и снова войдите.",
            newPassword: "Новый пароль",
            confirmNewPassword: "Подтвердите новый пароль",
            failedTitle: "Ошибка сброса пароля",
            save: "Установить новый пароль",
            saving: "Сохранение нового пароля...",
            hero: {
                secureReset: "Безопасный сброс",
                title: "Пароль меняется сразу",
                description: "После успешного сброса вы можете войти с новым паролем.",
                tokenProtection: "Защита одноразовым токеном"
            }
        }
    },
    dashboard: {
        title: "Операционный дашборд",
        subtitle: "Последний снепшот: {{value}}",
        workerHealth: "Состояние воркеров",
        queuePressure: "Нагрузка очередей",
        componentStatus: "Состояние компонентов",
        riskSummary: "Итог по рискам",
        staleWorkers_one: "{{count}} воркер устарел",
        staleWorkers_few: "{{count}} воркера устарели",
        staleWorkers_many: "{{count}} воркеров устарело",
        staleWorkers_other: "{{count}} воркера устарели",
        componentsDown_one: "{{count}} компонент недоступен",
        componentsDown_few: "{{count}} компонента недоступны",
        componentsDown_many: "{{count}} компонентов недоступно",
        componentsDown_other: "{{count}} компонента недоступны",
        allHealthy: "Все нормально",
        operational: "Операционно",
        staleCount: "{{count}} устаревших",
        downCount: "{{count}} недоступных",
        workersTracked: "В мониторинге: {{count}} воркеров",
        totalComponents: "Всего компонентов: {{count}}",
        monitoringWidgetUnavailable: "Виджет мониторинга недоступен",
        requestsWidgetUnavailable: "Виджет запросов недоступен",
        requestsTitle: "Последние запросы на подписку",
        requestsDescription: "Исходящие запросы, ожидающие проверки",
        noRequests: "Запросов нет.",
        noWidgetsTitle: "Нет доступных виджетов",
        noWidgetsDescription: "Для текущих прав не доступно ни одного виджета.",
        reviewCapabilityGranted: "subscriptions.review выдано",
        readOnly: "Только чтение"
    },
    monitoring: {
        accessDeniedDescription: "У вашей учетной записи нет разрешения `monitoring.read`.",
        accessEventsNew: "access_events.NEW",
        outboxNew: "outbox.new",
        oldestUnprocessed: "Самое старое необработанное: {{value}}",
        workersTableCaption: "Глобальное состояние воркеров и свежесть heartbeat.",
        componentsTableCaption: "Глобальное состояние компонентов и диагностика.",
        worker: "Воркер",
        component: "Компонент",
        lastError: "Последняя ошибка",
        checked: "Проверено",
        error: "Ошибка"
    },
    personHover: {
        openProfile: "Открыть профиль"
    },
    profile: {
        account: "Аккаунт",
        subtitle: "Управляйте данными аккаунта и привязкой Telegram для админ-уведомлений.",
        detailsTitle: "Данные профиля",
        detailsDescription: "Обновите персональные данные вашей учетной записи.",
        email: "Email",
        saveFailedTitle: "Не удалось сохранить профиль",
        savedTitle: "Сохранено",
        saveSuccess: "Профиль успешно обновлен.",
        saveUnexpectedError: "Непредвиденная ошибка при обновлении профиля.",
        saveChanges: "Сохранить изменения",
        securityNoteTitle: "Примечание по безопасности",
        securityNoteDescription: "Изменения профиля и пароля выполняются через аутентифицированные API-эндпоинты текущего администратора.",
        password: {
            title: "Смена пароля",
            description: "Введите текущий пароль, затем новый и подтверждение.",
            current: "Текущий пароль",
            new: "Новый пароль",
            confirm: "Повторите новый пароль",
            update: "Обновить пароль",
            updating: "Обновление пароля...",
            cannotChangeTitle: "Не удалось сменить пароль",
            updatedTitle: "Пароль обновлен",
            success: {
                changed: "Пароль успешно изменен."
            },
            errors: {
                mismatch: "Новый пароль и подтверждение не совпадают.",
                unexpectedChange: "Непредвиденная ошибка при смене пароля."
            }
        },
        telegram: {
            title: "Привязка Telegram",
            description: "Привяжите Telegram-аккаунт для функций админ-бота.",
            linkStatus: "Статус привязки",
            linked: "Привязан",
            notLinked: "Не привязан",
            notLinkedHintPrefix: "Сгенерируйте код и отправьте",
            notLinkedHintSuffix: "боту.",
            userId: "Telegram user id: {{value}}",
            generate: "Сгенерировать код привязки",
            generating: "Генерация...",
            unlink: "Отвязать Telegram",
            unlinking: "Отвязка...",
            activeCode: "Активный код",
            expires: "Истекает: {{value}}",
            updatedTitle: "Telegram обновлен",
            actionFailedTitle: "Ошибка действия Telegram",
            howToLink: "Как привязать",
            steps: {
                generate: "1. Сгенерируйте код выше.",
                openChat: "2. Откройте чат с Telegram-ботом.",
                sendPrefix: "3. Отправьте команду:",
                sendSuffix: "."
            },
            success: {
                unlinked: "Telegram-аккаунт успешно отвязан."
            },
            errors: {
                generateUnexpected: "Непредвиденная ошибка при генерации кода привязки Telegram.",
                unlinkUnexpected: "Непредвиденная ошибка при отвязке Telegram-аккаунта."
            }
        }
    },
    admins: {
        title: "Админы и доступ",
        subtitle: "Управляйте аккаунтами админов, приглашайте новых сотрудников и контролируйте роли.",
        accessDeniedDescription: "У вашей учетной записи нет разрешения `admin.manage`.",
        pageLoadFailedTitle: "Не удалось загрузить страницу админов",
        loadFailed: "Не удалось загрузить админов",
        updateStatusFailed: "Не удалось обновить статус админа",
        updateRoleFailed: "Не удалось обновить роль",
        createResetFailed: "Не удалось создать токен сброса",
        cannotDisableLastSuperAdmin: "Нельзя отключить последнего активного super_admin",
        cannotChangeOwnRole: "Нельзя менять свою собственную роль",
        totalAdmins: "Всего админов",
        active: "Активные",
        disabled: "Отключенные",
        operationFailedTitle: "Операция не выполнена",
        passwordResetGenerated: "Токен сброса пароля создан",
        tokenExpires: "Токен истекает",
        tokenLabel: "Токен",
        resetUrlLabel: "Ссылка сброса",
        registryTitle: "Реестр админов",
        registryDescription: "Обновляйте статусы, меняйте роли и создавайте ссылки сброса пароля.",
        securityNoteTitle: "Примечание по безопасности",
        securityNoteDescription: "Токены приглашения и сброса - чувствительные данные. Передавайте их только по защищенным каналам.",
        permissionBadge: "Разрешение: {{permission}}",
        noAdminsFound: "Админы не найдены.",
        table: {
            admin: "Админ",
            unnamedAdmin: "Без имени",
            selectRole: "Выберите роль",
            notLinked: "не привязан",
            resetPassword: "Сбросить пароль"
        },
        invitePanel: {
            createInvite: "Создать инвайт",
            invite: "Инвайт",
            sheetTitle: "Создать инвайт администратора",
            sheetDescription: "Сгенерируйте безопасный инвайт-токен для нового администратора.",
            drawerTitle: "Создать инвайт администратора",
            drawerDescription: "Выберите роль и срок, затем создайте одноразовый токен."
        },
        inviteForm: {
            adminEmail: "Email администратора",
            roleSource: "Источник роли",
            existingRole: "Существующая роль",
            newRole: "Новая роль",
            role: "Роль",
            newRoleName: "Название новой роли",
            permissions: "Разрешения",
            expiration: "Срок действия",
            inviteCreationFailedTitle: "Не удалось создать инвайт",
            inviteCreatedTitle: "Инвайт создан",
            roleValue: "Роль: {{value}}",
            expiresValue: "Истекает: {{value}}",
            inviteCode: "Код инвайта",
            inviteLink: "Ссылка инвайта",
            copyCode: "Копировать код",
            copyLink: "Копировать ссылку",
            createInvite: "Создать инвайт",
            createRoleAndInvite: "Создать роль + инвайт",
            noRoles: "Пока нет ролей. Создайте новую роль.",
            placeholders: {
                chooseRole: "Выберите роль",
                newRoleName: "ops_manager",
                selectExpiration: "Выберите срок"
            },
            presets: {
                viewer: "Пресет Viewer",
                operator: "Пресет Operator",
                admin: "Пресет Admin",
                hint: "Пресеты — это быстрые шаблоны. Ниже можно тонко настроить права вручную."
            },
            expirationOptions: {
                "86400000": "24 часа",
                "259200000": "72 часа",
                "604800000": "7 дней"
            },
            errors: {
                missingPermission: "Отсутствует разрешение: {{permission}}",
                emailRequired: "Email обязателен",
                roleRequired: "Роль обязательна",
                newRoleNameRequired: "Название новой роли обязательно",
                newRolePermissionRequired: "Выберите хотя бы одно разрешение для новой роли",
                createRoleFailed: "Не удалось создать роль",
                createInviteFailed: "Не удалось создать инвайт",
                copyTokenFailed: "Не удалось скопировать токен инвайта в этом браузере",
                copyLinkFailed: "Не удалось скопировать ссылку инвайта в этом браузере"
            }
        },
        roleForm: {
            roleName: "Название роли",
            roleNameImmutable: "Название роли неизменяемо.",
            permissions: "Разрешения",
            cannotSaveTitle: "Не удалось сохранить роль",
            saving: "Сохранение...",
            createRole: "Создать роль",
            savePermissions: "Сохранить разрешения",
            placeholders: {
                roleName: "ops_manager"
            },
            errors: {
                roleNameRequired: "Название роли обязательно",
                permissionRequired: "Выберите хотя бы одно разрешение",
                saveFailed: "Не удалось сохранить роль"
            }
        },
        rolePanel: {
            createTitle: "Создать роль",
            editTitle: "Редактировать {{roleName}}",
            roleFallback: "роль",
            createDescription: "Определите новую роль и назначьте разрешения.",
            editDescription: "Измените набор разрешений для выбранной роли.",
            createRole: "Создать роль",
            role: "Роль",
            edit: "Редактировать",
            editAria: "Редактировать {{roleName}}"
        }
    },
    roles: {
        title: "Управление ролями",
        subtitle: "Создавайте роли и настраивайте наборы разрешений для админов.",
        pageLoadFailedTitle: "Не удалось загрузить страницу ролей",
        loadFailed: "Не удалось загрузить роли",
        createFailed: "Не удалось создать роль",
        updateFailed: "Не удалось обновить роль",
        operationFailedTitle: "Ошибка операции с ролью",
        total: "Всего ролей",
        uniquePermissions: "Уникальные разрешения",
        mostUsedPermission: "Самое используемое разрешение",
        permissionsAssigned_one: "Назначено {{count}} разрешение",
        permissionsAssigned_few: "Назначено {{count}} разрешения",
        permissionsAssigned_many: "Назначено {{count}} разрешений",
        permissionsAssigned_other: "Назначено {{count}} разрешения",
        noPermissionsAssigned: "Разрешения не назначены."
    },
    auditLogs: {
        subtitle: "Операционная история с фильтрами в URL и серверной пагинацией.",
        filtersDescription: "Фильтруйте по актеру, действию, сущности и временному диапазону.",
        accessDeniedDescription: "У вашей учетной записи нет разрешения `monitoring.read`.",
        pageLoadFailedTitle: "Не удалось загрузить аудит-логи",
        loadFailed: "Не удалось загрузить аудит-логи",
        historyStream: "Поток истории",
        historyRange: "{{from}}-{{to}} из {{total}} записей.",
        noLogsForFilters: "По текущим фильтрам аудит-логов нет.",
        table: {
            at: "Время",
            actor: "Актер",
            action: "Действие",
            entity: "Сущность",
            meta: "Метаданные"
        }
    },
    persons: {
        subtitle: "Профили персон и terminal-идентификаторы в разрезе устройств.",
        accessDeniedDescription: "У вашей учетной записи нет разрешения `persons.read`.",
        pageLoadFailedTitle: "Не удалось загрузить страницу персон",
        loadFailed: "Не удалось загрузить персон",
        searchByNameOrIin: "Имя или IIN содержит",
        mutationFailedTitle: "Ошибка операции",
        range: "{{from}}-{{to}} из {{total}} персон.",
        autoMappingsFailed: "Персона создана, но не удалось применить {{count}} автосопоставлений.",
        createFailed: "Не удалось создать персону",
        updateFailed: "Не удалось обновить персону",
        tableDescription: "Управляйте профилями персон и открывайте страницу идентичностей.",
        terminalLinks: "Terminal-связи",
        noPersonsFound: "Персоны не найдены.",
        unknownName: "Неизвестное имя",
        linked: "Связано",
        notLinked: "Не связано",
        open: "Открыть",
        loadPersonFailed: "Не удалось загрузить персону",
        personPageLoadFailedTitle: "Не удалось загрузить страницу персоны",
        personNotFound: "Персона не найдена",
        back: "Назад",
        noGlobalTerminalId: "нет глобального terminal id",
        deviceIdentities: "Идентичности устройств",
        deviceIdentitiesDescription: "Terminal ID привязываются к конкретному устройству.",
        deviceId: "ID устройства",
        terminalPersonId: "Terminal Person ID",
        noIdentitiesForPerson: "Для этой персоны идентичностей нет.",
        createIdentityFailed: "Не удалось создать идентичность",
        updateIdentityFailed: "Не удалось обновить идентичность",
        confirmDeleteIdentity: "Удалить это сопоставление идентичности?",
        deleteIdentityFailed: "Не удалось удалить идентичность",
        deleteFailed: "Не удалось удалить персону",
        bulkDeleteFailed: "Не удалось удалить выбранных персон",
        deleting: "Удаление...",
        delete: "Удалить",
        actionCompletedTitle: "Действие выполнено",
        deleteSummarySingle: "Персона успешно удалена.",
        deleteSummaryBulk: "Удалено: {{deleted}}. Не найдено: {{notFound}}. Ошибок: {{errors}}.",
        filters: {
            button: "Фильтры",
            title: "Фильтры персон",
            description: "Фильтруйте список по данным персоны и состоянию связи с терминалами.",
            searchLabel: "Имя или IIN",
            linkStatusLabel: "Статус связи",
            deviceLabel: "Связанный терминал",
            includeDevicesLabel: "Включить терминалы",
            excludeDevicesLabel: "Исключить терминалы",
            includeDevicesPlaceholder: "Выберите терминалы для включения",
            excludeDevicesPlaceholder: "Выберите терминалы для исключения",
            clearSelection: "Очистить",
            allDevices: "Все терминалы",
            devicesLoadFailed: "Не удалось загрузить список терминалов для фильтров.",
            linkStatus: {
                all: "Все персоны",
                linked: "Только связанные",
                unlinked: "Только не связанные"
            }
        },
        selection: {
            selected: "Выбрано: {{count}}",
            clear: "Снять выбор",
            linkToTerminal: "Добавить в терминал",
            delete: "Удалить выбранных",
            selectPage: "Выбрать всех персон на текущей странице",
            selectPerson: "Выбрать персону {{iin}}"
        },
        bulkTerminalCreate: {
            title: "Добавить выбранных персон на терминалы",
            description: "Все выбранные персоны будут созданы на одном наборе терминалов. Здесь редактируются только даты действия.",
            datesTitle: "Период действия",
            validFrom: "Действует с",
            validTo: "Действует до",
            defaultsHint: "ID пользователя терминала, отображаемое имя, IIN, тип пользователя, authority и остальные поля берутся из текущих значений по умолчанию для создания terminal user.",
            devicesTitle: "Целевые терминалы",
            noDevices: "Нет доступных включённых терминалов.",
            personsTitle: "Выбрано персон: {{count}}",
            existingLinksTitle: "Текущие связи с терминалами",
            noLinkedDevices: "Связей с терминалами пока нет.",
            previewTitle: "Что произойдёт",
            loadingPreview: "Загружаем текущие связи с терминалами...",
            previewLoadFailedTitle: "Не удалось загрузить превью связей",
            previewLoadFailed: "Не удалось загрузить текущие связи терминалов для выбранных персон.",
            createBadge: "Создать",
            skipBadge: "Пропустить",
            noTargetDevicesSelected: "Выберите целевые терминалы, чтобы увидеть превью.",
            summaryTitle: "Сводка записи",
            summaryDescription: "Будет создано {{persons}} персон на {{devices}} выбранных терминалах.",
            createPairsSummary: "Пар на создание: {{count}}",
            skipPairsSummary: "Пар на пропуск: {{count}}",
            allPairsAlreadyLinked: "Все выбранные пары персона-терминал уже существуют. Выберите другой терминал, чтобы продолжить.",
            submit: "Создать на терминалах",
            submitting: "Создание...",
            failed: "Не удалось создать выбранных персон на терминалах.",
            successSummary: "Запись на терминалы завершена. Успешно: {{success}}. Ошибок: {{failed}}. Пропущено: {{skipped}}."
        },
        deleteDialog: {
            singleTitle: "Удалить персону?",
            bulkTitle: "Удалить выбранных персон?",
            singleDescription: "Персона {{name}} будет удалена из системы.",
            bulkDescription: "Из системы будут удалены {{count}} выбранных персон.",
            confirmSingle: "Удалить персону",
            confirmBulk: "Удалить выбранных",
            effects: {
                identities: "Связи с terminal identities будут удалены.",
                subscriptions: "Активные подписки будут деактивированы и останутся в истории.",
                requests: "Связанные subscription requests будут отвязаны. Pending-заявки ready_for_review вернутся на этап выбора персоны.",
                snapshot: "Импортированный snapshot терминалов и история останутся без изменений."
            }
        },
        advancedIdentityMapping: "Расширенное сопоставление идентичностей",
        importActions: {
            sync: "Синхронизировать terminal users"
        },
        panel: {
            createTitle: "Создать персону",
            editTitle: "Редактировать персону",
            createDescription: "Создайте профиль персоны в системе.",
            editDescription: "Обновите данные персоны. Идентичности устройств управляются отдельно.",
            createPerson: "Создать персону",
            edit: "Редактировать",
            editAria: "Редактировать {{value}}"
        },
        form: {
            cannotSaveTitle: "Не удалось сохранить персону",
            operationFailed: "Операция завершилась ошибкой",
            iinValid: "ИИН валиден.",
            iinInvalid: "Введите ровно 12 цифр.",
            autoIdentitySuggestionsTitle: "Автоподсказки идентичностей",
            autoIdentitySuggestionsDescription: "Подсказки подгружаются автоматически при корректном ИИН. Выбранные записи будут применены после создания персоны.",
            searchingDevices: "Поиск устройств...",
            autoMappingsLoadFailed: "Не удалось загрузить автосопоставления",
            previewDiagnostics: "eligible {{eligible}}, requests {{requests}}, errors {{errors}}",
            terminalValue: "terminal: {{value}}",
            nameValue: "name: {{value}}",
            alreadyLinked: "уже привязано",
            createPerson: "Создать персону",
            placeholders: {
                iin: "030512550123",
                firstName: "Алихан",
                lastName: "Ержанов"
            }
        },
        identityPanel: {
            addTitle: "Добавить идентичность",
            editTitle: "Редактировать идентичность",
            addDescription: "Привяжите персону к конкретному устройству и terminal person id.",
            editDescription: "Обновите маппинг устройства для этой персоны.",
            addIdentity: "Добавить идентичность",
            add: "Добавить",
            edit: "Редактировать",
            editAria: "Редактировать идентичность"
        },
        identityForm: {
            cannotSaveTitle: "Не удалось сохранить идентичность",
            operationFailed: "Операция завершилась ошибкой",
            noDevicesHint: "Устройства не найдены. Сначала создайте устройство в Device Operations.",
            autoNoMatch: "Совпадений в выбранном устройстве не найдено.",
            autoFindFailed: "Автопоиск завершился ошибкой",
            autoFound: "Найдено: {{id}}",
            autoFoundWithDetails: "Найдено: {{id}} ({{details}})",
            autoFinding: "Автопоиск...",
            autoFindInDevice: "Автопоиск в выбранном устройстве",
            addIdentity: "Добавить идентичность",
            placeholders: {
                selectDevice: "Выберите устройство",
                noDevicesAvailable: "Нет доступных устройств",
                terminalPersonId: "T-10001"
            }
        },
        autoDialog: {
            auto: "Авто",
            title: "Автосопоставление идентичностей",
            description: "Просмотрите сопоставления по ИИН для этой персоны и примените выбранные записи.",
            preview: "Предпросмотр",
            previewing: "Предпросмотр...",
            operationFailedTitle: "Операция завершилась ошибкой",
            diagnostics: "eligible {{eligible}}, requests {{requests}}, errors {{errors}}",
            terminalValue: "terminal: {{value}}",
            nameValue: "name: {{value}}",
            sourceValue: "source: {{value}}",
            userTypeValue: "userType: {{value}}",
            scoreValue: "score: {{value}}",
            alreadyLinked: "уже привязано",
            applyResultTitle: "Результат применения",
            applyResultDescription: "linked {{linked}}, already linked {{alreadyLinked}}, conflicts {{conflicts}}, errors {{errors}}",
            applying: "Применение...",
            applySelected: "Применить выбранное",
            errors: {
                previewFailed: "Не удалось получить предпросмотр автосопоставлений",
                selectAtLeastOne: "Выберите хотя бы одно сопоставление идентичности.",
                applyFailed: "Не удалось применить автосопоставления"
            }
        }
    },
    alerts: {
        title: "Центр алертов",
        subtitle: "Управляйте правилами и подписками на уведомления для своего аккаунта.",
        pageLoadFailedTitle: "Не удалось загрузить страницу алертов",
        sessionMissingAdminId: "В сессии отсутствует идентификатор администратора.",
        loadFailed: "Не удалось загрузить алерты",
        cannotUpdateSubscription: "Не удалось обновить подписку",
        refreshData: "Обновить данные",
        triggeredNow: "Сработали сейчас",
        criticalActive: "Критичные активные",
        enabledRules: "Включенные правила",
        deliveryScopeTitle: "Область доставки",
        deliveryScopeDescription: "На странице доступен единый сценарий: создание, редактирование и подписка на правила.",
        rulesTitle: "Правила",
        rulesDescription: "Включайте и выключайте персональные уведомления по правилам без изменения глобальной конфигурации.",
        subscriptionUpdateFailedTitle: "Не удалось обновить подписку",
        limitedAccessTitle: "Ограниченный доступ",
        limitedAccessDescription: "У вас нет разрешения `admin.manage`, поэтому переключатели подписок доступны только для чтения.",
        noRulesConfigured: "Правила алертов еще не настроены.",
        recentEvents: "Последние события",
        recentEventsDescription: "Последние переходы алертов из мониторинговых снапшотов.",
        noRecentEvents: "В последних снапшотах нет событий алертов.",
        deleteRule: "Удалить",
        deletingRule: "Удаление...",
        deleteRuleFailed: "Не удалось удалить правило алерта.",
        deleteRuleFailedTitle: "Не удалось удалить правило",
        unknownRule: "Неизвестное правило",
        deleteDialog: {
            title: "Удалить правило алерта?",
            description: 'Правило "{{name}}" будет удалено без возможности восстановления.',
            warning: "Это действие нельзя отменить.",
            effects: {
                subscriptions: "Все подписки на это правило тоже будут удалены.",
                events: "Вся история Recent Events, связанная с этим правилом, тоже будет удалена."
            }
        },
        ruleId: "ID правила",
        toggleNotificationFor: "Переключить уведомления для {{name}}",
        subscribed: "Подписка включена",
        off: "Выкл.",
        status: {
            triggered: "triggered",
            recovering: "recovering",
            resolved: "resolved"
        },
        severity: {
            warning: "warning",
            critical: "critical"
        },
        table: {
            rule: "Правило",
            severity: "Severity",
            notifyMe: "Уведомлять меня",
            message: "Сообщение",
            createdAt: "Создано"
        },
        ruleTypes: {
            worker_stale: "Worker stale",
            outbox_backlog: "Outbox backlog",
            bot_down: "Bot down",
            access_event_lag: "Access event lag",
            error_spike: "Error spike",
            device_service_down: "Device service down",
            adapter_down: "Adapter down"
        },
        rulePanel: {
            createRule: "Создать правило",
            createTitle: "Создать правило алерта",
            createSheetDescription: "Определите правило, которое будет создавать алерты из monitoring-снепшотов.",
            createDrawerDescription: "Настройте тип правила, уровень важности и пороги срабатывания.",
            edit: "Редактировать",
            editTitle: "Редактировать правило алерта",
            editAria: "Редактировать {{ruleName}}",
            editSheetDescription: "Обновите метаданные и пороги правила, не покидая обзор алертов.",
            editDrawerDescription: "Обновите настройки правила и сохраните изменения."
        },
        ruleForm: {
            ruleName: "Название правила",
            ruleType: "Тип правила",
            severity: "Важность",
            status: "Статус",
            initialStatus: "Начальный статус",
            config: "Конфиг",
            createRule: "Создать правило",
            saving: "Сохранение...",
            cannotCreateTitle: "Не удалось создать правило",
            cannotUpdateTitle: "Не удалось обновить правило",
            placeholders: {
                ruleName: "High outbox backlog",
                selectRuleType: "Выберите тип правила",
                selectSeverity: "Выберите важность"
            },
            hints: {
                workerStale: "При необходимости ограничьте по workerId.",
                outboxBacklog: "Задайте хотя бы один порог: maxNew или maxOldestAgeMs.",
                botDown: "Дополнительная конфигурация не требуется.",
                accessEventLag: "maxOldestAgeMs обязателен.",
                errorSpike: "Необходимо указать source и increaseBy.",
                deviceServiceDown: "Дополнительная конфигурация не требуется.",
                adapterDown: "При необходимости ограничьте по adapterId или vendorKey."
            },
            configFields: {
                workerIdOptional: "workerId (необязательно)",
                source: "source",
                maxNew: "maxNew",
                maxOldestAgeMs: "maxOldestAgeMs",
                increaseBy: "increaseBy",
                adapterIdOptional: "adapterId (необязательно)",
                vendorKeyOptional: "vendorKey (необязательно)",
                sources: {
                    core: "core",
                    deviceService: "device_service",
                    accessEvents: "access_events",
                    outbox: "outbox"
                },
                placeholders: {
                    workerId: "access-events-worker",
                    maxNew: "100",
                    maxOldestAgeMsOutbox: "60000",
                    maxOldestAgeMsAccessEvents: "120000",
                    increaseBy: "10",
                    adapterId: "mock-01",
                    vendorKey: "dahua"
                }
            },
            errors: {
                ruleNameRequired: "Название правила обязательно.",
                createFailed: "Не удалось создать правило алерта.",
                updateFailed: "Не удалось обновить правило.",
                outboxThresholdsPositive: "Пороги outbox должны быть положительными целыми числами.",
                outboxThresholdRequired: "Укажите maxNew или maxOldestAgeMs для outbox backlog.",
                accessEventLagRequired: "maxOldestAgeMs обязателен и должен быть положительным целым числом.",
                errorSpikeIncreaseRequired: "increaseBy обязателен и должен быть положительным целым числом."
            }
        }
    },
    subscriptionRequests: {
        title: "Запросы на подписку",
        subtitle: "Проверяйте запросы от родителей и историю решений.",
        failedToLoad: "Не удалось загрузить запросы на подписку",
        accessDeniedDescription: "У вашей учетной записи нет права `subscriptions.read`.",
        totalFiltered: "Всего по фильтру",
        pending: "В ожидании",
        reviewCapability: "Возможность модерации",
        queueTitle: "Очередь запросов",
        queueRange: "{{from}}-{{to}} из {{total}} запросов.",
        telegramLinkRequired: "Нужна привязка Telegram",
        telegramLinkRequiredDescription: "Review endpoint требует `adminTgUserId`. Привяжите Telegram в профиле перед approve/reject.",
        reviewFailed: "Ошибка модерации",
        reviewCompleted: "Модерация завершена",
        resolveFailed: "Ошибка разрешения",
        resolveCompleted: "Разрешение завершено",
        requestMarkedAs: "Запрос {{requestId}} помечен как {{status}}.",
        requestMovedTo: "Запрос {{requestId}} переведен в {{resolutionStatus}}, персона {{personId}}.",
        resolveHintNew: "Ожидается препроцессинг воркером. Ручное определение доступно.",
        resolvePanelTitle: "Разрешить персону для запроса",
        createPerson: "Создать персону",
        createPersonDescription: "Создайте новую запись персоны для этого запроса.",
        personFoundNoCreate: "Персона найдена по ИИН. Создание доступно только когда нет совпадений.",
        findPersonByIin: "Найти персону по ИИН",
        searchResults: "Результаты поиска",
        createFailed: "Ошибка создания",
        loadFailed: "Не удалось загрузить запросы",
        filtersDescription: "Фильтруйте очередь и историю запросов с серверной пагинацией.",
        telegramAccountNotLinked: "Telegram-аккаунт не привязан у текущего администратора.",
        noPersonsForIinQuery: "По этому ИИН запросу персоны не найдены",
        resolvePermissionMissing: "Нет права subscriptions.review или запрос уже не в статусе pending",
        resolvePanelDescriptionDesktop: "Выберите существующую персону или создайте новую по ИИН, затем переведите запрос в ready_for_review.",
        resolvePanelDescriptionMobile: "Выберите персону для этого запроса и переведите его в состояние готовности к проверке.",
        rejectRequestAria: "Отклонить запрос {{requestId}}",
        approveRequestAria: "Одобрить запрос {{requestId}}",
        resolveRequestAria: "Разрешить персону для запроса {{requestId}}"
    },
    accessEvents: {
        title: "События прохода",
        subtitle: "Полный поток событий прохода с фильтрами, пагинацией и действиями маппинга для unmatched событий.",
        accessDeniedDescription: "У вашей учетной записи нет разрешения `access_events.read`.",
        totalFilteredEvents: "Всего отфильтрованных событий",
        unmatchedOnPage: "Unmatched на странице",
        mappingCapability: "Возможность маппинга",
        mappingGranted: "access_events.map выдано",
        eventsStream: "Поток событий",
        eventsRange: "{{from}}-{{to}} из {{total}} событий.",
        failedToLoad: "Не удалось загрузить события прохода",
        noEventsForFilters: "По выбранным фильтрам событий прохода нет.",
        mappingRestricted: "Маппинг ограничен",
        mappingRestrictedDescription: "Вы можете просматривать unmatched события, но для привязки нужно разрешение `access_events.map`.",
        filtersDescription: "Сужайте выборку по статусу, направлению, устройству и идентификаторам.",
        deviceIdPlaceholder: "ID устройства",
        occurredAt: "Время события",
        person: "Персона",
        action: "Действие",
        dirShort: "Напр.",
        diagShort: "Диагн.",
        diagnostics: "Диагностика",
        attempts: "Попытки",
        error: "Ошибка",
        none: "нет",
        diagnosticsForEventAria: "Диагностика для события {{eventId}}",
        mappingOnlyForUnmatched: "Маппинг доступен только для событий в статусе UNMATCHED.",
        mapTerminalIdentity: "Сопоставить terminal identity",
        mapTerminalIdentityDescription: "Привяжите ID персоны в терминале к известной персоне и отправьте unmatched события на повторную обработку.",
        mapTerminalIdentityDescriptionMobile: "Найдите персону и привяжите terminal ID, чтобы разрешить unmatched события.",
        mapEventAria: "Сопоставить событие {{eventId}}",
        findPersonByIin: "Найти персону по ИИН",
        personSearchResults: "Результаты поиска персон",
        personDeviceMappings: "Маппинги персоны по девайсам",
        deviceMappingsLoaded: "Маппинги девайсов загружены",
        mappingFailed: "Ошибка маппинга",
        mappingCompleted: "Маппинг завершен",
        loadPersonDevicesFailed: "Не удалось загрузить девайсы персоны",
        searchPersonsFailed: "Не удалось найти персон",
        mapTerminalIdentityFailed: "Не удалось смаппить terminal identity",
        missingMapPermission: "Нет права access_events.map",
        personIdRequired: "Нужно указать ID персоны",
        terminalPersonIdRequired: "Нужно указать terminal person ID",
        iinQueryDigitsValidation: "Запрос ИИН должен содержать 1-12 цифр",
        createRequiresExactIin: "Для создания нужен точный 12-цифровой ИИН",
        identityDetectedForDevice: "Найден привязанный terminal ID для девайса {{deviceId}}. Поле заполнено автоматически.",
        identityNoMappingForDevice: "У этой персоны есть маппинги, но не для девайса {{deviceId}}.",
        mappingResultTemplate: "Маппинг {{status}}. Обновлено событий: {{updatedEvents}}.",
        loadingPersonDevices: "Загрузка девайсов персоны..."
    },
    devices: {
        monitoringTitle: "Мониторинг Device Service",
        monitoringSubtitle: "Операционное состояние адаптеров, девайсов и DS outbox.",
        monitoringFailed: "Не удалось загрузить мониторинг",
        monitoringUnavailable: "Снепшот мониторинга недоступен.",
        monitoringLoadFailed: "Не удалось загрузить данные мониторинга",
        adaptersStale: "Устаревшие адаптеры",
        devicesStale: "Устаревшие девайсы",
        outboxPending: "Ожидающие в outbox",
        outboxOldestNew: "Старейший new в outbox",
        adaptersHealthTitle: "Состояние адаптеров",
        adaptersHealthDescription: "Статус и свежесть heartbeat адаптер-сервисов.",
        devicesHealthTitle: "Состояние девайсов",
        devicesHealthDescription: "Маркер последнего события и stale-детект по девайсам.",
        outboxDescription: "Состояние очереди доставки внутри Device Service.",
        pendingOutboxDetected: "Обнаружены ожидающие элементы outbox",
        oldestPendingItem: "Самый старый ожидающий элемент: {{value}}",
        noValue: "n/a",
        accessDeniedDescription: "У вашей учетной записи нет разрешения `devices.read`.",
        opsTitle: "Операции с устройствами",
        opsSubtitle: "Управляйте устройствами, привязанными к каналам адаптеров, и отслеживайте операционное состояние.",
        opsPageLoadFailedTitle: "Не удалось загрузить устройства",
        opsLoadFailed: "Не удалось загрузить устройства",
        totalDevices: "Всего устройств",
        enabled: "Включено",
        writableScope: "Права на изменение",
        writeGranted: "devices.write выдано",
        registryTitle: "Реестр устройств",
        registryDescription: "Редактируйте метаданные, переключайте состояние и удаляйте устаревшие устройства.",
        searchDeviceIdAdapter: "Поиск по устройству, id, адаптеру",
        allAdapters: "Все адаптеры",
        range: "{{from}}-{{to}} из {{total}} устройств.",
        restrictedModeTitle: "Ограниченный режим",
        restrictedModeDescription: "Вы можете просматривать устройства, но для изменений требуется разрешение `devices.write`.",
        cannotUpdateState: "Не удалось обновить состояние устройства",
        cannotDeleteDevice: "Не удалось удалить устройство",
        updated: "Обновлено",
        noDevicesRegistered: "Устройства еще не зарегистрированы.",
        noActiveAdapterInstances: "Нет активных инстансов адаптера",
        toggleAria: "Переключить {{name}}",
        confirm: "Подтвердить",
        adaptersLoadFailed: "Не удалось загрузить адаптеры",
        adaptersPageLoadFailedTitle: "Не удалось загрузить адаптеры",
        adaptersOpsTitle: "Операции с адаптерами",
        adaptersOpsSubtitle: "Режим только чтения для операционного статуса, режима и метаданных адаптеров.",
        totalAdapters: "Всего адаптеров",
        activeMode: "Активный режим",
        drainingMode: "Режим draining",
        searchInstanceVendorUrl: "Поиск по инстансу, вендору, url",
        allModes: "Все режимы",
        active: "Активный",
        draining: "Draining",
        adaptersRange: "{{from}}-{{to}} из {{total}}",
        instanceKey: "Ключ инстанса",
        baseUrl: "Базовый URL",
        retention: "Ретеншен",
        capabilities: "Возможности",
        notDeclared: "не указано",
        version: "Версия",
        registered: "Зарегистрирован",
        noAdaptersRegistered: "Адаптеры не зарегистрированы",
        noAdaptersRegisteredDescription: "Device service пока не сообщил ни о одной регистрации адаптера.",
        panel: {
            createTitle: "Создать устройство",
            editTitle: "Редактировать устройство",
            createDescription: "Зарегистрируйте устройство и привяжите его к адаптеру.",
            editDescription: "Обновите метаданные устройства и операционные настройки.",
            addDevice: "Добавить устройство",
            add: "Добавить",
            edit: "Редактировать",
            editAria: "Редактировать {{value}}"
        },
        form: {
            cannotSaveTitle: "Не удалось сохранить устройство",
            deviceId: "ID устройства",
            deviceSettings: "Настройки устройства",
            schemaDriven: "По схеме",
            rawJson: "Raw JSON",
            noSchemaHint: "Адаптер не объявил схему настроек. Укажите JSON вручную.",
            noAdaptersHint: "Адаптеры не найдены. Сначала зарегистрируйте инстанс адаптера в Device Operations.",
            activeInstances: "Активные инстансы: {{value}}",
            createDevice: "Создать устройство",
            placeholders: {
                deviceId: "door-1",
                name: "Главный вход",
                selectDirection: "Выберите направление",
                selectAdapterVendor: "Выберите вендора адаптера",
                settingsJson: "{\"zone\":\"A\"}"
            },
            errors: {
                checkSettings: "Проверьте поля настроек устройства и попробуйте снова.",
                operationFailed: "Операция завершилась ошибкой"
            }
        },
        settings: {
            hintAria: "Подсказка для {{label}}",
            required: "обязательно",
            optional: "необязательно",
            noItemsYet: "Список пока пуст.",
            noTemplateFields: "Шаблонные поля пока отсутствуют.",
            removeItemAria: "Удалить элемент",
            addItem: "Добавить элемент",
            addTemplateField: "Добавить шаблонное поле",
            propertyName: "Название свойства",
            addMapping: "Добавить маппинг",
            toggleValue: "Переключить значение",
            placeholders: {
                selectValue: "Выберите значение",
                value: "Значение",
                fieldKey: "Ключ поля",
                identityValueTemplate: "{{identityValue}}",
                mappingName: "iin",
                requiredValue: "Обязательное значение",
                optionalValue: "Необязательное значение"
            }
        },
        sort: {
            updatedNewest: "Обновлены: сначала новые",
            updatedOldest: "Обновлены: сначала старые",
            lastSeenNewest: "Последний heartbeat: сначала новые",
            lastSeenOldest: "Последний heartbeat: сначала старые",
            nameAsc: "Имя: А-Я",
            nameDesc: "Имя: Я-А"
        }
    },
    permissions: {
        labels: {
            "admin.manage": "Управление администраторами",
            "devices.read": "Просмотр устройств",
            "devices.write": "Управление устройствами",
            "subscriptions.read": "Просмотр подписок",
            "subscriptions.review": "Модерация подписок",
            "subscriptions.manage": "Управление подписками",
            "access_events.read": "Просмотр событий доступа",
            "access_events.map": "Связывание событий доступа",
            "persons.read": "Просмотр персон",
            "persons.write": "Управление персонами",
            "settings.read": "Просмотр настроек",
            "settings.write": "Управление настройками",
            "monitoring.read": "Просмотр мониторинга",
            "retention.manage": "Управление хранением данных"
        }
    },
    enums: {
        adminStatus: {
            pending: "pending",
            active: "active",
            disabled: "disabled"
        },
        monitoringStatus: {
            all: "Все статусы",
            ok: "OK",
            stale: "Устарел",
            down: "Недоступен"
        },
        direction: {
            all: "Все направления",
            IN: "Вход",
            OUT: "Выход"
        },
        order: {
            newest: "Сначала новые",
            oldest: "Сначала старые"
        },
        subscriptionStatus: {
            all: "Все",
            pending: "В ожидании",
            approved: "Одобрено",
            rejected: "Отклонено",
            not_pending: "Не в ожидании"
        },
        subscriptionResolution: {
            all: "Все",
            new: "Новый",
            ready_for_review: "Готов к модерации",
            needs_person: "Требует персону"
        },
        accessEventStatus: {
            all: "Все статусы",
            NEW: "Новый",
            PROCESSING: "В обработке",
            PROCESSED: "Обработано",
            FAILED_RETRY: "Ошибка с повтором",
            UNMATCHED: "Без совпадения",
            ERROR: "Ошибка"
        }
    },
    fallback: {
        dashboard: "Дашборд",
        reload: "Перезагрузить",
        skipToContent: "Перейти к содержимому",
        pageNotFoundTitle: "Страница не найдена",
        pageNotFoundDescription: "Страница не существует или была перемещена.",
        unavailableTitle: "Бэкенд недоступен",
        unavailableDescription: "Не удается подключиться к API. Проверьте backend и API base URL.",
        errorTitle: "Что-то пошло не так",
        errorDescription: "Непредвиденная ошибка приложения. Попробуйте снова."
    },
    errors: {
        invalid_credentials: "Неверный email или пароль.",
        current_password_invalid: "Текущий пароль неверный.",
        admin_disabled: "Учетная запись администратора отключена.",
        admin_invite_not_found: "Инвайт-ссылка недействительна.",
        admin_invite_expired: "Срок действия инвайта истек. Запросите новый.",
        admin_invite_used: "Инвайт уже был использован.",
        admin_invite_email_mismatch: "Email не совпадает с инвайтом.",
        admin_email_exists: "Администратор с таким email уже существует.",
        role_not_found: "Роль из инвайта больше недоступна.",
        password_reset_not_found: "Ссылка восстановления недействительна.",
        password_reset_expired: "Срок действия ссылки восстановления истек. Запросите новую.",
        password_reset_used: "Ссылка восстановления уже была использована.",
        admin_not_found: "Учетная запись администратора не найдена.",
        admin_tg_not_linked: "Этот email администратора не привязан к Telegram.",
        admin_tg_link_expired: "Срок действия Telegram-кода истек. Запросите новый.",
        admin_tg_link_used: "Telegram-код уже использован. Запросите новый.",
        admin_tg_code_purpose_mismatch: "Некорректный Telegram-код.",
        telegram_delivery_unavailable: "Сейчас невозможно отправить Telegram-код. Попробуйте позже.",
        first_admin_already_exists: "Система уже инициализирована. Используйте вход.",
        server_unreachable: "Не удается подключиться к серверу. Попробуйте позже."
    }
} as const;



