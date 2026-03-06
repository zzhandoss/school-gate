export const kzCommon = {
    app: {
        brand: {
            schoolGate: "School Gate",
            adminUi: "Әкімші панелі"
        },
        nav: {
            main: "Негіздер",
            monitoring: "Бақылау",
            administration: "Әкімшілік",
            deviceOperations: "Құрылғылар",
            dashboard: "Бақылау тақтасы",
            subscriptionRequests: "Жазылым сұраулары",
            accessEvents: "Өткізу оқиғалары",
            persons: "тұлғалар",
            alerts: "Ескертулер",
            auditLogs: "Аудит журналдары",
            settings: "Параметрлер",
            import: "Импорт",
            admins: "Әкімшілер",
            roles: "Рөлдер",
            devices: "Құрылғылар",
            adapters: "Адаптерлер",
            dsMonitoring: "DS мониторингі",
            profile: "Профиль"
        },
        shell: {
            signedInAs: "Сіз жүйеге кірдіңіз",
            role: "Рөл",
            operationsOverview: "Операциялық шолу",
            openMenu: "Мәзірді ашу",
            closeMenu: "Мәзірді жабу",
            expandSidebar: "Бүйірлік тақтаны кеңейтіңіз",
            collapseSidebar: "Бүйірлік тақтаны жию",
            breadcrumb: "нан үгіндісі",
            language: "Тіл",
            signOut: "Шығу",
            signingOut: "Шығу...",
            goBack: "Артқа"
        },
        language: {
            title: "Интерфейс тілі",
            description: "Әкімші тақтасында қолтаңбалар мен хабарлардың тілін таңдаңыз.",
            ru: "Орысша",
            en: "Ағылшын",
            kz: "Қазақша"
        }
    },
    settings: {
        accessDeniedTitle: "Кіруге тыйым салынды",
        accessDeniedDescription: "Есептік жазбаңызда `settings.read` рұқсаты жоқ.",
        loadFailedTitle: "Параметрлерді жүктеу сәтсіз аяқталды",
        runtimeTitle: "Орындалу уақыты параметрлері",
        runtimeDescription: "Бөлім бойынша сұрау аралықтарын, сақтауды, бақылауды және хабарландыруларды басқарыңыз.",
        writable: "Өзгертуге болады",
        readOnly: "Тек оқу",
        refreshTab: "Жаңарту қойындысы",
        sectionUpdated: "Бөлім жаңартылды.",
        loadFailed: "Параметрлерді жүктеу сәтсіз аяқталды",
        saveFailed: "Бөлім сақталмады",
        changed: "Өзгертілді",
        clean: "Өзгерістер жоқ",
        enabled: "енгізілген",
        disabled: "Өшірулі",
        saveFailedTitle: "Қатені сақтау",
        savedTitle: "Сақталды",
        resetSection: "Қалпына келтіру бөлімі",
        saving: "Сақталуда...",
        saveSection: "Бөлімді сақтау",
        meta: {
            effective: "effective",
            db: "db",
            env: "env",
            updated: "updated",
            notOverridden: "жоққа шығарылмаған",
            never: "ешқашан"
        },
        groups: {
            worker: {
                title: "Жұмысшы",
                description: "Негізгі жұмысшыны сұрау және партиялық өңдеу параметрлері.",
                fields: {
                    pollMs: {
                        label: "Сауалнама (мс)",
                        hint: "Дауыс беру циклдері арасындағы аралық."
                    },
                    batch: {
                        label: "Пакет мөлшері",
                        hint: "Циклдегі элементтер саны."
                    },
                    autoResolvePersonByIin: {
                        label: "ЖСН бойынша автоматты анықтау",
                        hint: "ЖСН негізінде автоматты сәйкестендіруді қосады."
                    }
                }
            },
            outbox: {
                title: "Outbox",
                description: "Жеткізу қайталануы және шығыс жәшігіндегі оқиғаларды жалға беру стратегиясы.",
                fields: {
                    pollMs: {
                        label: "Сауалнама (мс)",
                        hint: "Шығыс жәшігін сұрау аралығы."
                    },
                    batch: {
                        label: "Пакет мөлшері",
                        hint: "Циклдегі жолдар саны."
                    },
                    maxAttempts: {
                        label: "Макс. әрекеттері",
                        hint: "Тұрақты қате пайда болғанша қайталау саны."
                    },
                    leaseMs: {
                        label: "Жалдау (мс)",
                        hint: "Өңдеу кезінде жалға алу күту уақыты."
                    },
                    processingBy: {
                        label: "Процестер",
                        hint: "Меншік иесінің идентификаторы."
                    }
                }
            },
            accessEvents: {
                title: "Оқиғаларға қол жеткізу",
                description: "Қол жеткізу оқиғасы кезегінің әрекеті.",
                fields: {
                    pollMs: {
                        label: "Сауалнама (мс)",
                        hint: "Оқиға кезегін сұрау аралығы."
                    },
                    batch: {
                        label: "Пакет мөлшері",
                        hint: "Циклдегі оқиғалар саны."
                    },
                    retryDelayMs: {
                        label: "Қайталау кідірісі (мс)",
                        hint: "Сәтсіз оқиғаларды қайта өңдеу алдында үзіліс жасаңыз."
                    },
                    leaseMs: {
                        label: "Жалдау (мс)",
                        hint: "Өңдеу кезінде жалға алу күту уақыты."
                    },
                    maxAttempts: {
                        label: "Макс. әрекеттері",
                        hint: "Тұрақты қате пайда болғанша қайталау саны."
                    },
                    processingBy: {
                        label: "Процестер",
                        hint: "Меншік иесінің идентификаторы."
                    }
                }
            },
            retention: {
                title: "Сақтау",
                description: "Тазалау кестесі және деректерді сақтау терезелері.",
                fields: {
                    pollMs: {
                        label: "Сауалнама (мс)",
                        hint: "Тазалауды бастау аралығы."
                    },
                    batch: {
                        label: "Пакет мөлшері",
                        hint: "Бір циклде жойылған жолдар саны."
                    },
                    accessEventsDays: {
                        label: "Оқиғаларға қол жеткізу (күндер)",
                        hint: "Қол жеткізу оқиғаларын сақтау мерзімі."
                    },
                    auditLogsDays: {
                        label: "Аудит журналдары (күндер)",
                        hint: "Аудит журналын сақтау мерзімі."
                    }
                }
            },
            monitoring: {
                title: "Бақылау",
                description: "Жүрек соғуы қызметкері үшін өзектілік шегі.",
                fields: {
                    workerTtlMs: {
                        label: "Жұмысшы TTL (мс)",
                        hint: "Жұмысшы ескірген деп есептелетін шек."
                    }
                }
            },
            notifications: {
                title: "Хабарландырулар",
                description: "Хабарландыру үлгісі және олардың өзектілігінің шекті мәндері.",
                fields: {
                    parentTemplate: {
                        label: "Ата-ана үлгісі",
                        hint: "Үлгі ата-ана хабарландырулары үшін пайдаланылады."
                    },
                    parentMaxAgeMs: {
                        label: "Макс. ата-ананың жасы (мс)",
                        hint: "Осы шекті мәннен асқан ата-ана хабарландыруларын жібермеңіз."
                    },
                    alertMaxAgeMs: {
                        label: "Макс. ескерту жасы (мс)",
                        hint: "Осы шекті мәннен асқан ескертулерді жібермеңіз."
                    }
                }
            }
        },
        validation: {
            positiveInteger: "{{field}} оң бүтін сан болуы керек.",
            required: "{{field}} бос болуы мүмкін емес."
        }
    },
    common: {
        actions: {
            refresh: "Жаңарту",
            refreshing: "Жаңарту...",
            reset: "Қалпына келтіру",
            applyFilters: "Сүзгілерді қолданыңыз",
            close: "Жабу",
            cancel: "Болдырмау",
            search: "Іздеу",
            searching: "Іздеу...",
            create: "Жасау",
            creating: "Жасалу...",
            map: "Сәйкестік идентификаторы",
            mapping: "Салыстыру...",
            resolve: "Адамды анықтаңыз",
            resolving: "Ажыратымдылық...",
            approveRequest: "Өтінішті мақұлдау",
            rejectRequest: "Сұрауды қабылдамау",
            showFilters: "Сүзгілерді көрсету",
            hideFilters: "Сүзгілерді жасыру"
        },
        selected: "таңдалған",
        filters: {
            title: "Сүзгілер",
            appliedCount: "Қолданылған: {{count}}",
            noFilters: "Сүзгілер жоқ",
            pageSize: "Бет өлшемі",
            status: "Күй",
            direction: "Бағыт",
            resolution: "Ажыратымдылық",
            order: "Сұрыптау"
        },
        pagination: {
            range: "{{from}}-{{to}} бастап {{total}}",
            perPage_one: "Әр бет үшін {{count}}",
            perPage_few: "Әр бет үшін {{count}}",
            perPage_many: "Әр бет үшін {{count}}",
            perPage_other: "Әр бет үшін {{count}}"
        },
        labels: {
            iin: "ЖСН",
            telegram: "Telegram",
            personId: "Тұлға идентификаторы",
            requestId: "Сұраныс идентификаторы",
            currentStatus: "Ағымдағы күй",
            eventId: "Оқиға идентификаторы",
            device: "Құрылғы",
            created: "Құрылды",
            actions: "Әрекеттер",
            name: "Аты",
            adapter: "Адаптер",
            instance: "Мысал",
            vendor: "Сатушы",
            mode: "Режим",
            ttl: "TTL",
            lastSeen: "Соңғы жүрек соғысы",
            lastEvent: "Соңғы оқиға",
            outbox: "Outbox",
            resolution: "Ажыратымдылық",
            status: "Күй",
            direction: "Бағыт",
            terminal: "Терминал",
            id: "id",
            firstName: "Аты",
            lastName: "Фамилия"
        },
        placeholders: {
            email: "admin@example.com",
            displayName: "Көрсетілетін атыңыз",
            searchAdapter: "Адаптерді табу",
            searchDevice: "Құрылғыны іздеу",
            searchIinPrefix: "12 таңбалы ЖСН немесе префикс",
            personUuid: "Адам UUID",
            terminalPersonId: "Терминалдағы тұлға идентификаторы",
            optional: "Қосымша",
            actorId: "Актер идентификаторы",
            auditAction: "Әрекет",
            entityType: "Нысан түрі",
            entityId: "Нысан идентификаторы"
        },
        empty: {
            noRequestsForFilter: "Ағымдағы сүзгілерге сұраулар жоқ.",
            noAdapterTelemetry: "Адаптердің телеметриясы әлі қол жетімді емес.",
            noDeviceTelemetry: "Құрылғының телеметриясы әлі қол жетімді емес.",
            noPersonsByIin: "Бұл сұрау бойынша ешкімнің ЖСН табылмады.",
            noSearchResults: "Нәтиже жоқ.",
            noMatches: "Сәйкестік табылмады."
        }
    },
    ui: {
        close: "Жабу",
        toggleSidebar: "Бүйірлік тақтаны ауыстыру",
        pagination: {
            navigation: "Беттеу",
            previous: "Артқа",
            previousAria: "Алдыңғы бетке өтіңіз",
            next: "Алға",
            nextAria: "Келесі бетке өтіңіз",
            morePages: "Қосымша беттер"
        }
    },
    validation: {
        emailInvalid: "Дұрыс электрондық поштаны енгізіңіз",
        passwordRequired: "Құпия сөз қажет",
        confirmPasswordRequired: "Құпия сөзіңізді растаңыз",
        nameTooLong: "Аты тым ұзын",
        passwordsDoNotMatch: "Құпия сөздер сәйкес келмейді",
        telegramCodeInvalid: "6 таңбалы кодты енгізіңіз"
    },
    auth: {
        common: {
            password: "Құпия сөз",
            confirmPassword: "Құпия сөзіңізді растаңыз",
            nameOptional: "Аты (міндетті емес)",
            backToSignIn: "Кіру дегенге қайта келу",
            goToSignIn: "Кіруге барыңыз"
        },
        login: {
            title: "Әкімші Кіру",
            subtitle: "Операциялық бақылау тақтасына кіру үшін құпия сөзіңізді немесе Telegram OTP пайдаланыңыз.",
            methods: {
                password: "Құпия сөз",
                telegram: "Telegram"
            },
            forgotPassword: "Құпия сөзіңізді ұмыттыңыз ба?",
            signIn: "Жүйеге кіру",
            signingIn: "Жүйеге кіру...",
            sendingCode: "Код жіберілуде...",
            sendCodeToTelegram: "Telegram-ға код жіберіңіз",
            telegramCode: "6 таңбалы код",
            codeExpiresAt: "Код {{value}} дейін жарамды.",
            changeEmail: "Электрондық поштаны өзгерту",
            resendCode: "Кодты қайта жіберу",
            verifying: "Тексерілуде...",
            telegramLoginTitle: "Telegram арқылы кіру",
            authFailedTitle: "Аутентификация қатесі",
            notice: {
                codeSent: "Код байланысқан Telegram-ға жіберілді. Жалғастыру үшін 6 санды енгізіңіз."
            },
            errors: {
                unexpectedLogin: "Күтпеген кіру қатесі",
                unexpectedRequestTelegram: "Telegram кодын сұрау кезінде күтпеген қате",
                unexpectedTelegramLogin: "Telegram арқылы кіру кезінде күтпеген қате"
            },
            hero: {
                protected: "Қауіпсіз әкімші қатынасы",
                title: "Мектеп қақпасының операциялық орталығы",
                description: "Жұмысшыларды, кезектерді және кіріс жазылым сұрауларын бір бақылау тақтасынан бақылаңыз."
            }
        },
        firstAdmin: {
            title: "Бірінші әкімшіні инициализациялау",
            subtitle: "Бос жүйеде бастапқы кіру үшін бір рет пайдаланыңыз.",
            create: "Бірінші әкімшіңізді жасаңыз",
            creating: "Әкімші жасалуда...",
            bootstrapFailedTitle: "Инициализация қатесі",
            placeholders: {
                email: "root@example.com"
            },
            hero: {
                oneTimeSetup: "Бір реттік орнату",
                title: "Бірінші әкімші супер әкімші рұқсатын алады",
                description: "Сәтті инициализациядан кейін сіз автоматты түрде жүйеге кіріп, бақылау тақтасына кіресіз.",
                emptySystemsOnly: "Тек бос жүйелер үшін қол жетімді",
                strongCredentials: "Өндіріс үшін күшті тіркелгі деректерін пайдаланыңыз"
            }
        },
        invite: {
            missingTitle: "Шақыру сілтемесі жоқ",
            missingDescription: "Шақыру таңбалауышы URL мекенжайында табылмады. Әкімшіден жаңа сілтемені сұраңыз.",
            title: "Шақыру арқылы тіркеуді аяқтау",
            subtitle: "Тіркелгіні орнатуды аяқтап, тікелей бақылау тақтасына өтіңіз.",
            complete: "Тіркеуді аяқтаңыз",
            completing: "Тіркелу аяқталуда...",
            registrationFailedTitle: "Тіркеу қатесі",
            hero: {
                onboarding: "Шақыру арқылы қосылу",
                title: "Әкімші консоліне кіруге бір қадам қалды",
                description: "Тіркелгеннен кейін жүйе автоматты түрде жүйеге кіріп, бақылау тақтасын ашады.",
                validated: "Шақыру таңбалауышы жіберу кезінде әлдеқашан расталған"
            }
        },
        passwordResetRequest: {
            title: "Құпия сөзді қалпына келтіру сұрауы",
            subtitle: "Әкімші электрондық поштасын енгізіңіз. Есептік жазба бар болса, қалпына келтіру белгісі шығарылады.",
            send: "Қалпына келтіру сұрауын жіберіңіз",
            sending: "Өтінім жіберілуде...",
            requestFailedTitle: "Сұраныс қатесі",
            requestAcceptedTitle: "Өтінім қабылданды",
            requestAcceptedDescription: "Тіркелгі бар болса, қалпына келтіру таңбалауышы әлдеқашан белсенді.",
            devTokenPrefix: "Әзірлеуші белгісі:",
            openConfirmPage: "растау бетін ашыңыз",
            hero: {
                recovery: "Есептік жазбаны қалпына келтіру",
                title: "Әкімші қатынасын қалпына келтіріңіз",
                description: "Қалпына келтіру сілтемелері бір реттік пайдаланылады және автоматты түрде аяқталады.",
                emailHint: "Тек сенімді әкімші электрондық поштасын пайдаланыңыз"
            }
        },
        passwordResetConfirm: {
            missingTitle: "Қалпына келтіру белгісі жоқ",
            missingDescription: "Дұрыс қалпына келтіру сілтемесінен бетті ашыңыз немесе жаңа таңбалауышты сұраңыз.",
            requestNewToken: "Жаңа қалпына келтіру белгісін сұрау",
            title: "Жаңа құпия сөзді орнатыңыз",
            subtitle: "Жаңа әкімші құпия сөзін таңдап, жүйеге қайта кіріңіз.",
            newPassword: "Жаңа құпия сөз",
            confirmNewPassword: "Жаңа құпия сөзіңізді растаңыз",
            failedTitle: "Құпия сөзді қалпына келтіру қатесі",
            save: "Жаңа құпия сөзді орнатыңыз",
            saving: "Жаңа құпия сөз сақталуда...",
            hero: {
                secureReset: "Қауіпсіз қалпына келтіру",
                title: "Құпия сөз дереу өзгереді",
                description: "Сәтті қалпына келтіргеннен кейін сіз жаңа құпия сөзбен кіре аласыз.",
                tokenProtection: "Бір реттік токенді қорғау"
            }
        }
    },
    dashboard: {
        title: "Операциялық бақылау тақтасы",
        subtitle: "Соңғы сурет: {{value}}",
        workerHealth: "Жұмысшы мәртебесі",
        queuePressure: "Кезекте жүктеме",
        componentStatus: "Компоненттің жағдайы",
        riskSummary: "Тәуекелдердің қысқаша мазмұны",
        staleWorkers_one: "{{count}} жұмысшы ескірген",
        staleWorkers_few: "{{count}} жұмысшылар ескірген",
        staleWorkers_many: "{{count}} жұмысшылар ескірген",
        staleWorkers_other: "{{count}} жұмысшылар ескірген",
        componentsDown_one: "{{count}} компоненті қолжетімді емес",
        componentsDown_few: "{{count}} құрамдастары қолжетімді емес",
        componentsDown_many: "{{count}} құрамдастары қолжетімді емес",
        componentsDown_other: "{{count}} құрамдастары қолжетімді емес",
        allHealthy: "Бәрі жақсы",
        operational: "Операциялық",
        staleCount: "{{count}} ескірген",
        downCount: "{{count}} қолжетімсіз",
        workersTracked: "Мониторингте: {{count}} жұмысшылар",
        totalComponents: "Жалпы құрамдас бөліктер: {{count}}",
        monitoringWidgetUnavailable: "Бақылау виджеті қолжетімді емес",
        requestsWidgetUnavailable: "Сұрау виджеті қолжетімді емес",
        requestsTitle: "Соңғы жазылым сұраулары",
        requestsDescription: "Қаралуды күткен шығыс сұраулар",
        noRequests: "Сұраныс жоқ.",
        noWidgetsTitle: "Қолжетімді виджеттер жоқ",
        noWidgetsDescription: "Ағымдағы рұқсаттар үшін қол жетімді виджеттер жоқ.",
        reviewCapabilityGranted: "subscriptions.шолу шығарылды",
        readOnly: "Тек оқу"
    },
    monitoring: {
        accessDeniedDescription: "Есептік жазбаңызда `monitoring.read` рұқсаты жоқ.",
        accessEventsNew: "access_events.NEW",
        outboxNew: "outbox.new",
        oldestUnprocessed: "Ең ескі шикізат: {{value}}",
        workersTableCaption: "Жұмысшылардың жаһандық жағдайы және жаңа жүрек соғысы.",
        componentsTableCaption: "Жаһандық құрамдас күй және диагностика.",
        worker: "Жұмысшы",
        component: "Құрамдас",
        lastError: "Соңғы қате",
        checked: "Тексерілді",
        error: "Қате"
    },
    personHover: {
        openProfile: "Профильді ашу"
    },
    profile: {
        account: "Есептік жазба",
        subtitle: "Тіркелгі мәліметтерін және әкімші хабарландырулары үшін Telegram сілтемесін басқарыңыз.",
        detailsTitle: "Профиль деректері",
        detailsDescription: "Тіркелгіңіздің жеке ақпаратын жаңартыңыз.",
        email: "Email",
        saveFailedTitle: "Профильді сақтау мүмкін болмады",
        savedTitle: "Сақталды",
        saveSuccess: "Профиль сәтті жаңартылды.",
        saveUnexpectedError: "Профильді жаңарту кезінде күтпеген қате орын алды.",
        saveChanges: "Өзгерістерді сақтау",
        securityNoteTitle: "Қауіпсіздік ескертуі",
        securityNoteDescription: "Профиль мен құпия сөзді өзгерту ағымдағы әкімшінің аутентификацияланған API соңғы нүктелері арқылы жасалады.",
        password: {
            title: "Құпия сөзді өзгерту",
            description: "Ағымдағы құпия сөзді, содан кейін жаңасын және растауды енгізіңіз.",
            current: "Ағымдағы құпия сөз",
            new: "Жаңа құпия сөз",
            confirm: "Жаңа құпия сөзді қайталаңыз",
            update: "Құпия сөзді жаңарту",
            updating: "Құпия сөзді жаңарту...",
            cannotChangeTitle: "Құпия сөзді өзгерту мүмкін болмады",
            updatedTitle: "Құпия сөз жаңартылды",
            success: {
                changed: "Құпия сөз сәтті өзгертілді."
            },
            errors: {
                mismatch: "Жаңа құпия сөз мен растау сәйкес келмейді.",
                unexpectedChange: "Құпия сөзді өзгерту кезінде күтпеген қате."
            }
        },
        telegram: {
            title: "Telegram байланыстыру",
            description: "Әкімші бот функциялары үшін Telegram тіркелгіңізді байланыстырыңыз.",
            linkStatus: "Байланыстыру күйі",
            linked: "Байланған",
            notLinked: "Тіркелген жоқ",
            notLinkedHintPrefix: "Кодты жасаңыз және жіберіңіз",
            notLinkedHintSuffix: "бот.",
            userId: "Telegram user id: {{value}}",
            generate: "Байланыстыру кодын жасаңыз",
            generating: "Ұрпақ...",
            unlink: "Telegram байланысын жою",
            unlinking: "Жасақ...",
            activeCode: "Белсенді код",
            expires: "Мерзімі аяқталады: {{value}}",
            updatedTitle: "Telegram жаңартылды",
            actionFailedTitle: "Telegram әрекетінің қатесі",
            howToLink: "Қалай байлау керек",
            steps: {
                generate: "1. Жоғарыдағы кодты жасаңыз.",
                openChat: "2. Telegram боты арқылы чатты ашыңыз.",
                sendPrefix: "3. Пәрменді жіберіңіз:",
                sendSuffix: "."
            },
            success: {
                unlinked: "Telegram тіркелгісі сәтті жойылды."
            },
            errors: {
                generateUnexpected: "Telegram байланыстыру кодын жасау кезінде күтпеген қате.",
                unlinkUnexpected: "Telegram тіркелгісін жою кезінде күтпеген қате."
            }
        }
    },
    admins: {
        title: "Әкімшілер және кіру",
        subtitle: "Әкімші тіркелгілерін басқарыңыз, жаңа қызметкерлерді шақырыңыз және рөлдерді басқарыңыз.",
        accessDeniedDescription: "Есептік жазбаңызда `admin.manage` рұқсаты жоқ.",
        pageLoadFailedTitle: "Әкімші бетін жүктеу сәтсіз аяқталды",
        loadFailed: "Әкімшілерді жүктеу сәтсіз аяқталды",
        updateStatusFailed: "Әкімші күйін жаңарту мүмкін болмады",
        updateRoleFailed: "Рөлді жаңарту мүмкін болмады",
        createResetFailed: "Қалпына келтіру белгісін жасау сәтсіз аяқталды",
        cannotDisableLastSuperAdmin: "Соңғы белсенді super_admin өшіру мүмкін емес",
        cannotChangeOwnRole: "Сіз өзіңіздің рөліңізді өзгерте алмайсыз",
        totalAdmins: "Жалпы әкімшілер",
        active: "Белсенді",
        disabled: "Өшірілген",
        operationFailedTitle: "Операция сәтсіз аяқталды",
        passwordResetGenerated: "Құпия сөзді қалпына келтіру таңбалауышы жасалды",
        tokenExpires: "Токеннің мерзімі аяқталады",
        tokenLabel: "Токен",
        resetUrlLabel: "Сілтемені қалпына келтіру",
        registryTitle: "Әкімші тіркелу",
        registryDescription: "Күйлерді жаңарту, рөлдерді өзгерту және құпия сөзді қалпына келтіру сілтемелерін жасау.",
        securityNoteTitle: "Қауіпсіздік ескертуі",
        securityNoteDescription: "Шақыру және қалпына келтіру таңбалауыштары құпия деректер болып табылады. Оларды тек қауіпсіз арналар арқылы жіберіңіз.",
        permissionBadge: "Рұқсат: {{permission}}",
        noAdminsFound: "Әкімшілер табылмады.",
        table: {
            admin: "Админ",
            unnamedAdmin: "Аты жоқ",
            selectRole: "Рөлді таңдаңыз",
            notLinked: "қосылмаған",
            resetPassword: "Құпия сөзді қалпына келтіру"
        },
        invitePanel: {
            createInvite: "Шақыру жасаңыз",
            invite: "Шақыру",
            sheetTitle: "Әкімші шақыруын жасаңыз",
            sheetDescription: "Жаңа әкімші үшін қауіпсіз шақыру белгісін жасаңыз.",
            drawerTitle: "Әкімші шақыруын жасаңыз",
            drawerDescription: "Рөл мен терминді таңдаңыз, содан кейін бір реттік белгіні жасаңыз."
        },
        inviteForm: {
            adminEmail: "Әкімшінің электрондық поштасы",
            roleSource: "Рөл көзі",
            existingRole: "Бар рөл",
            newRole: "Жаңа рөл",
            role: "Рөл",
            newRoleName: "Жаңа рөлдің аты",
            permissions: "Рұқсаттар",
            expiration: "Жарамдылық мерзімі",
            inviteCreationFailedTitle: "Шақыру жасалмады",
            inviteCreatedTitle: "Шақыру жасалды",
            roleValue: "Рөл: {{value}}",
            expiresValue: "Мерзімі аяқталады: {{value}}",
            inviteCode: "Шақыру коды",
            inviteLink: "Шақыру сілтемесі",
            copyCode: "Кодты көшіру",
            copyLink: "Сілтемені көшіру",
            createInvite: "Шақыру жасаңыз",
            createRoleAndInvite: "Рөл + шақыру жасау",
            noRoles: "Әзірге рөлдер жоқ. Жаңа рөл жасаңыз.",
            placeholders: {
                chooseRole: "Рөлді таңдаңыз",
                newRoleName: "ops_manager",
                selectExpiration: "Терминді таңдаңыз"
            },
            presets: {
                viewer: "Алдын ала орнатылған қарау құралы",
                operator: "Оператордың алдын ала орнатуы",
                admin: "Алдын ала орнатылған әкімші",
                hint: "Алдын ала орнатулар - жылдам үлгілер. Төменде құқықтарды қолмен дәл реттеуге болады."
            },
            expirationOptions: {
                "86400000": "24 сағат",
                "259200000": "72 сағат",
                "604800000": "7 күн"
            },
            errors: {
                missingPermission: "Рұқсат жоқ: {{permission}}",
                emailRequired: "Электрондық пошта қажет",
                roleRequired: "Рөл қажет",
                newRoleNameRequired: "Жаңа рөлдің атауы қажет",
                newRolePermissionRequired: "Жаңа рөл үшін кемінде бір рұқсатты таңдаңыз",
                createRoleFailed: "Рөлді жасау мүмкін болмады",
                createInviteFailed: "Шақыру жасалмады",
                copyTokenFailed: "Бұл браузерде шақыру белгісін көшіру мүмкін болмады",
                copyLinkFailed: "Бұл браузерде шақыру сілтемесін көшіру мүмкін болмады"
            }
        },
        roleForm: {
            roleName: "Рөл аты",
            roleNameImmutable: "Рөл атауы өзгермейді.",
            permissions: "Рұқсаттар",
            cannotSaveTitle: "Рөл сақталмады",
            saving: "Сақталуда...",
            createRole: "Рөл жасау",
            savePermissions: "Рұқсаттарды сақтау",
            placeholders: {
                roleName: "ops_manager"
            },
            errors: {
                roleNameRequired: "Рөл атауы қажет",
                permissionRequired: "Кемінде бір ажыратымдылықты таңдаңыз",
                saveFailed: "Рөл сақталмады"
            }
        },
        rolePanel: {
            createTitle: "Рөл жасау",
            editTitle: "{{roleName}} өңдеу",
            roleFallback: "рөл",
            createDescription: "Жаңа рөлді анықтаңыз және рұқсаттарды тағайындаңыз.",
            editDescription: "Таңдалған рөл үшін рұқсаттар жинағын өзгертіңіз.",
            createRole: "Рөл жасау",
            role: "Рөл",
            edit: "Өңдеу",
            editAria: "{{roleName}} өңдеу"
        }
    },
    roles: {
        title: "Рөлді басқару",
        subtitle: "Рөлдерді жасаңыз және әкімшілер үшін рұқсат жиындарын конфигурациялаңыз.",
        pageLoadFailedTitle: "Рөлдер бетін жүктеу сәтсіз аяқталды",
        loadFailed: "Рөлдер жүктелмеді",
        createFailed: "Рөлді жасау мүмкін болмады",
        updateFailed: "Рөлді жаңарту мүмкін болмады",
        operationFailedTitle: "Рөл жұмысының қатесі",
        total: "Жалпы рөлдер",
        uniquePermissions: "Бірегей рұқсаттар",
        mostUsedPermission: "Ең көп қолданылатын ажыратымдылық",
        permissionsAssigned_one: "{{count}} рұқсаты тағайындалды",
        permissionsAssigned_few: "{{count}} рұқсаттары тағайындалды",
        permissionsAssigned_many: "{{count}} рұқсаттары тағайындалды",
        permissionsAssigned_other: "{{count}} рұқсаттары тағайындалды",
        noPermissionsAssigned: "Ешқандай рұқсаттар тағайындалмаған."
    },
    auditLogs: {
        subtitle: "URL сүзгілерімен және сервер жағындағы беттеумен операциялық тарих.",
        filtersDescription: "Актер, әрекет, нысан және уақыт ауқымы бойынша сүзгілеу.",
        accessDeniedDescription: "Есептік жазбаңызда `monitoring.read` рұқсаты жоқ.",
        pageLoadFailedTitle: "Аудит журналдарын жүктеу сәтсіз аяқталды",
        loadFailed: "Аудит журналдарын жүктеу сәтсіз аяқталды",
        historyStream: "Тарих ағыны",
        historyRange: "{{total}} жазбаларынан {{from}}-{{to}}.",
        noLogsForFilters: "Ағымдағы сүзгілер үшін аудит журналдары жоқ.",
        table: {
            at: "Уақыт",
            actor: "Актер",
            action: "Әрекет",
            entity: "Мәні",
            meta: "Метадеректер"
        }
    },
    persons: {
        subtitle: "Құрылғы бойынша адам профильдері мен терминал идентификаторлары.",
        accessDeniedDescription: "Есептік жазбаңызда `persons.read` рұқсаты жоқ.",
        pageLoadFailedTitle: "Адам бетін жүктеу мүмкін болмады",
        loadFailed: "Адам жүктелмеді",
        searchByNameOrIin: "Аты немесе ЖСН бар",
        mutationFailedTitle: "Жұмыс қатесі",
        range: "{{total}} адамның {{from}}-{{to}}.",
        autoMappingsFailed: "Адам жасалды, бірақ {{count}} автоматты салыстыру сәтсіз аяқталды.",
        createFailed: "Адамды жасау мүмкін болмады",
        updateFailed: "Адамды жаңарту мүмкін болмады",
        tableDescription: "Адам профильдерін басқарыңыз және сәйкестіктер бетін ашыңыз.",
        terminalLinks: "Терминалдық байланыстар",
        noPersonsFound: "Адам табылмады.",
        unknownName: "Белгісіз аты",
        linked: "Қатысты",
        notLinked: "Қатысты емес",
        open: "Ашық",
        loadPersonFailed: "Адам жүктелмеді",
        personPageLoadFailedTitle: "Адам бетін жүктеу мүмкін болмады",
        personNotFound: "Адам табылмады",
        back: "Артқа",
        noGlobalTerminalId: "ғаламдық терминал идентификаторы жоқ",
        deviceIdentities: "Құрылғы идентификаторлары",
        deviceIdentitiesDescription: "Терминал идентификаторлары белгілі бір құрылғыға байланысты.",
        deviceId: "Құрылғы идентификаторы",
        terminalPersonId: "Terminal Person ID",
        noIdentitiesForPerson: "Бұл адамның жеке басы жоқ.",
        createIdentityFailed: "Идентификатор жасалмады",
        updateIdentityFailed: "Идентификатор жаңартылмады",
        confirmDeleteIdentity: "Осы сәйкестендіру картасын жою қажет пе?",
        deleteIdentityFailed: "Идентификатор жойылмады",
        deleteFailed: "Адамды жою мүмкін болмады",
        bulkDeleteFailed: "Таңдалған адамдарды жою мүмкін болмады",
        deleting: "Жою...",
        delete: "Жою",
        actionCompletedTitle: "Әрекет аяқталды",
        deleteSummarySingle: "Адам сәтті жойылды.",
        deleteSummaryBulk: "Жойылды: {{deleted}}. Табылмады: {{notFound}}. Қателер: {{errors}}.",
        filters: {
            button: "Сүзгілер",
            title: "Адам сүзгілері",
            description: "Тізімді адам деректері мен терминал байланысы күйі бойынша сүзіңіз.",
            searchLabel: "Аты немесе ЖСН",
            linkStatusLabel: "Байланыс күйі",
            deviceLabel: "Байланысқан терминал",
            includeDevicesLabel: "Қосылатын терминалдар",
            excludeDevicesLabel: "Алып тасталатын терминалдар",
            includeDevicesPlaceholder: "Қосылатын терминалдарды таңдаңыз",
            excludeDevicesPlaceholder: "Алып тасталатын терминалдарды таңдаңыз",
            clearSelection: "Тазалау",
            allDevices: "Барлық терминалдар",
            devicesLoadFailed: "Сүзгілер үшін терминалдар тізімін жүктеу мүмкін болмады.",
            linkStatus: {
                all: "Барлық адамдар",
                linked: "Тек байланысқандар",
                unlinked: "Тек байланыссыздар"
            }
        },
        selection: {
            selected: "Таңдалды: {{count}}",
            clear: "Таңдауды тазалау",
            linkToTerminal: "Терминалға қосу",
            delete: "Таңдалғандарды жою",
            selectPage: "Осы беттегі барлық адамды таңдау",
            selectPerson: "{{iin}} адамын таңдау"
        },
        bulkTerminalCreate: {
            title: "Таңдалған адамдарды терминалдарға қосу",
            description: "Барлық таңдалған адамдар бірдей терминалдар жиынына жазылады. Мұнда тек әрекет ету күндері өңделеді.",
            datesTitle: "Әрекет ету мерзімі",
            validFrom: "Басталу күні",
            validTo: "Аяқталу күні",
            defaultsHint: "Терминал пайдаланушы ID, көрсетілетін аты, ЖСН, user type, authority және басқа өрістер ағымдағы әдепкі terminal user жасау мәндерінен алынады.",
            devicesTitle: "Мақсатты терминалдар",
            noDevices: "Қосулы терминалдар жоқ.",
            personsTitle: "Таңдалған адамдар: {{count}}",
            existingLinksTitle: "Ағымдағы терминал байланыстары",
            noLinkedDevices: "Әзірге терминал байланыстары жоқ.",
            previewTitle: "Не орындалады",
            loadingPreview: "Ағымдағы терминал байланыстары жүктелуде...",
            previewLoadFailedTitle: "Байланыс алдын ала көрінісін жүктеу мүмкін болмады",
            previewLoadFailed: "Таңдалған адамдар үшін ағымдағы терминал байланыстарын жүктеу мүмкін болмады.",
            createBadge: "Құру",
            skipBadge: "Өткізу",
            noTargetDevicesSelected: "Алдын ала көріністі көру үшін мақсатты терминалдарды таңдаңыз.",
            summaryTitle: "Жазу қорытындысы",
            summaryDescription: "{{persons}} адам {{devices}} таңдалған терминалда жасалады.",
            createPairsSummary: "Құрылатын жұптар: {{count}}",
            skipPairsSummary: "Өткізілетін жұптар: {{count}}",
            allPairsAlreadyLinked: "Таңдалған адам-терминал жұптарының бәрі бұрыннан бар. Жалғастыру үшін басқа терминалды таңдаңыз.",
            submit: "Терминалдарда жасау",
            submitting: "Жасалуда...",
            failed: "Таңдалған адамдарды терминалдарда жасау мүмкін болмады.",
            successSummary: "Терминалдарға жазу аяқталды. Сәтті: {{success}}. Қате: {{failed}}. Өткізілді: {{skipped}}."
        },
        deleteDialog: {
            singleTitle: "Адамды жою керек пе?",
            bulkTitle: "Таңдалған адамдарды жою керек пе?",
            singleDescription: "{{name}} жүйеден жойылады.",
            bulkDescription: "Жүйеден {{count}} таңдалған адам жойылады.",
            confirmSingle: "Адамды жою",
            confirmBulk: "Таңдалғандарды жою",
            effects: {
                identities: "Терминал сәйкестік байланыстары жойылады.",
                subscriptions: "Белсенді жазылымдар өшіріліп, тарихта сақталады.",
                requests: "Байланысқан subscription request жазбалары ажыратылады. Pending ready_for_review сұраулары адамды қайта таңдауға қайтады.",
                snapshot: "Импортталған терминал snapshot деректері мен тарих өзгеріссіз қалады."
            }
        },
        advancedIdentityMapping: "Кеңейтілген сәйкестік басқаруы",
        importActions: {
            sync: "Terminal users синхрондау"
        },
        panel: {
            createTitle: "Адамды жасаңыз",
            editTitle: "Адамды өңдеу",
            createDescription: "Жүйеде адамның профилін жасаңыз.",
            editDescription: "Адам мәліметтерін жаңартыңыз. Құрылғы идентификаторлары бөлек басқарылады.",
            createPerson: "Адамды жасаңыз",
            edit: "Өңдеу",
            editAria: "{{value}} өңдеу"
        },
        form: {
            cannotSaveTitle: "Адамды сақтау мүмкін болмады",
            operationFailed: "Операция сәтсіз аяқталды",
            iinValid: "ЖСН жарамды.",
            iinInvalid: "Дәл 12 санды енгізіңіз.",
            autoIdentitySuggestionsTitle: "Автоматты сәйкестендіру ұсыныстары",
            autoIdentitySuggestionsDescription: "ЖСН дұрыс болса, кеңестер автоматты түрде жүктеледі. Таңдалған жазбалар адам жасалғаннан кейін қолданылады.",
            searchingDevices: "Құрылғыларды іздеу...",
            autoMappingsLoadFailed: "Автоматты карталар жүктелмеді",
            previewDiagnostics: "eligible {{eligible}}, requests {{requests}}, errors {{errors}}",
            terminalValue: "terminal: {{value}}",
            nameValue: "name: {{value}}",
            alreadyLinked: "әлдеқашан байланыстырылған",
            createPerson: "Адамды жасаңыз",
            placeholders: {
                iin: "030512550123",
                firstName: "Әлихан",
                lastName: "Ержанов"
            }
        },
        identityPanel: {
            addTitle: "Сәйкестікті қосыңыз",
            editTitle: "Сәйкестікті өңдеу",
            addDescription: "Адамды белгілі бір құрылғыға және терминалдық тұлға идентификаторына байланыстырыңыз.",
            editDescription: "Осы адам үшін құрылғы картасын жаңартыңыз.",
            addIdentity: "Сәйкестікті қосыңыз",
            add: "қосу",
            edit: "Өңдеу",
            editAria: "Сәйкестікті өңдеу"
        },
        identityForm: {
            cannotSaveTitle: "Идентификатор сақталмады",
            operationFailed: "Операция сәтсіз аяқталды",
            noDevicesHint: "Ешбір құрылғы табылмады. Алдымен Құрылғы операцияларында құрылғы жасаңыз.",
            autoNoMatch: "Таңдалған құрылғыда сәйкестік табылмады.",
            autoFindFailed: "Автоматты іздеу қатемен аяқталды",
            autoFound: "Табылды: {{id}}",
            autoFoundWithDetails: "Табылды: {{id}} ({{details}})",
            autoFinding: "Автоматты іздеу...",
            autoFindInDevice: "Таңдалған құрылғыда автоматты іздеу",
            addIdentity: "Сәйкестікті қосыңыз",
            placeholders: {
                selectDevice: "Құрылғыны таңдаңыз",
                noDevicesAvailable: "Қолжетімді құрылғылар жоқ",
                terminalPersonId: "T-10001"
            }
        },
        autoDialog: {
            auto: "Авто",
            title: "Автоматты сәйкестендіру",
            description: "Осы адамға арналған ЖСН сәйкестіктерін қарап шығыңыз және таңдалған жазбаларды қолданыңыз.",
            preview: "Алдын ала қарау",
            previewing: "Алдын ала қарау...",
            operationFailedTitle: "Операция сәтсіз аяқталды",
            diagnostics: "eligible {{eligible}}, requests {{requests}}, errors {{errors}}",
            terminalValue: "terminal: {{value}}",
            nameValue: "name: {{value}}",
            sourceValue: "source: {{value}}",
            userTypeValue: "userType: {{value}}",
            scoreValue: "score: {{value}}",
            alreadyLinked: "әлдеқашан байланыстырылған",
            applyResultTitle: "Өтініш нәтижесі",
            applyResultDescription: "linked {{linked}}, already linked {{alreadyLinked}}, conflicts {{conflicts}}, errors {{errors}}",
            applying: "Қолданба...",
            applySelected: "Таңдалған қолдану",
            errors: {
                previewFailed: "Автоматты сәйкестікті алдын ала қарау мүмкін болмады",
                selectAtLeastOne: "Кем дегенде бір сәйкестендіру картасын таңдаңыз.",
                applyFailed: "Автоматты сәйкестендірулер қолданылмады"
            }
        }
    },
    alerts: {
        title: "Ескерту орталығы",
        subtitle: "Тіркелгіңіз үшін ережелер мен хабарландыру жазылымдарын басқарыңыз.",
        pageLoadFailedTitle: "Ескертулер бетін жүктеу сәтсіз аяқталды",
        sessionMissingAdminId: "Сеанста әкімші идентификаторы жоқ.",
        loadFailed: "Ескертулер жүктелмеді",
        cannotUpdateSubscription: "Жазылым жаңартылмады",
        refreshData: "Деректерді жаңарту",
        triggeredNow: "Қазір жұмыс істеді",
        criticalActive: "Сыни белсенді",
        enabledRules: "Қамтылған ережелер",
        deliveryScopeTitle: "Жеткізу аймағы",
        deliveryScopeDescription: "Бір сценарий бетте қол жетімді: құру, өңдеу және ережелерге жазылу.",
        rulesTitle: "Ережелер",
        rulesDescription: "Жаһандық конфигурацияны өзгертпестен ережелерге негізделген жеке хабарландыруларды қосыңыз немесе өшіріңіз.",
        subscriptionUpdateFailedTitle: "Жазылым жаңартылмады",
        limitedAccessTitle: "Шектеулі қолжетімділік",
        limitedAccessDescription: "Сізде `admin.manage` рұқсаты жоқ, сондықтан жазылым қосқыштары тек оқуға арналған.",
        noRulesConfigured: "Ескерту ережелері әлі конфигурацияланбаған.",
        recentEvents: "Соңғы оқиғалар",
        recentEventsDescription: "Бақылау суреттерінен соңғы ескерту көшулері.",
        noRecentEvents: "Соңғы суреттерде ескерту оқиғалары жоқ.",
        deleteRule: "Жою",
        deletingRule: "Жою...",
        deleteRuleFailed: "Ескерту ережесін жою мүмкін болмады.",
        deleteRuleFailedTitle: "Ережені жою сәтсіз аяқталды",
        unknownRule: "Белгісіз ереже",
        deleteDialog: {
            title: "Ескерту ережесін жою керек пе?",
            description: '"{{name}}" ережесі қайтарымсыз жойылады.',
            warning: "Бұл әрекетті кері қайтару мүмкін емес.",
            effects: {
                subscriptions: "Бұл ережеге қатысты барлық жазылымдар да жойылады.",
                events: "Осы ережеге байланысты бүкіл Recent Events тарихы да жойылады."
            }
        },
        ruleId: "Ереже идентификаторы",
        toggleNotificationFor: "{{name}} үшін хабарландыруларды қосу/өшіру",
        subscribed: "Жазылым қамтылған",
        off: "Өшірулі",
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
            rule: "Ереже",
            severity: "Severity",
            notifyMe: "Маған хабарлаңыз",
            message: "Хабарлама",
            createdAt: "Құрылды"
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
            createRule: "Ереже құру",
            createTitle: "Ескерту ережесін жасаңыз",
            createSheetDescription: "Мониторинг суреттерінен ескертулер жасайтын ережені анықтаңыз.",
            createDrawerDescription: "Ереже түрін, маңыздылық деңгейін және іске қосу шектерін конфигурациялаңыз.",
            edit: "Өңдеу",
            editTitle: "Ескерту ережесін өңдеу",
            editAria: "{{ruleName}} өңдеу",
            editSheetDescription: "Ереже метадеректері мен шектерді ескерту көрінісінен шықпай жаңартыңыз.",
            editDrawerDescription: "Ереже параметрлерін жаңартыңыз және өзгертулерді сақтаңыз."
        },
        ruleForm: {
            ruleName: "Ереже атауы",
            ruleType: "Ереже түрі",
            severity: "Маңыздылығы",
            status: "Күй",
            initialStatus: "Бастапқы күй",
            config: "Конфигурация",
            createRule: "Ереже құру",
            saving: "Сақталуда...",
            cannotCreateTitle: "Ереже жасау мүмкін болмады",
            cannotUpdateTitle: "Ережені жаңарту мүмкін болмады",
            placeholders: {
                ruleName: "High outbox backlog",
                selectRuleType: "Ереже түрін таңдаңыз",
                selectSeverity: "Маңыздылықты таңдаңыз"
            },
            hints: {
                workerStale: "Қажет болса, workerId арқылы шектеңіз.",
                outboxBacklog: "Кем дегенде бір шекті көрсетіңіз: maxNew немесе maxOldestAgeMs.",
                botDown: "Қосымша конфигурация қажет емес.",
                accessEventLag: "maxOldestAgeMs қажет.",
                errorSpike: "Сіз көзді көрсетуіңіз керек және көбейту.",
                deviceServiceDown: "Қосымша конфигурация қажет емес.",
                adapterDown: "Қажет болса, adapterId немесе vendorKey арқылы шектеңіз."
            },
            configFields: {
                workerIdOptional: "жұмысшы идентификаторы (міндетті емес)",
                source: "source",
                maxNew: "maxNew",
                maxOldestAgeMs: "maxOldestAgeMs",
                increaseBy: "increaseBy",
                adapterIdOptional: "адаптер идентификаторы (міндетті емес)",
                vendorKeyOptional: "vendorKey (міндетті емес)",
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
                ruleNameRequired: "Ереженің атауы қажет.",
                createFailed: "Ескерту ережесін жасау сәтсіз аяқталды.",
                updateFailed: "Ережені жаңарту мүмкін емес.",
                outboxThresholdsPositive: "Шығу жәшігі шектері оң бүтін сандар болуы керек.",
                outboxThresholdRequired: "Шығыс жәшігінің кешігуі үшін maxNew немесе maxOldestAgeMs көрсетіңіз.",
                accessEventLagRequired: "maxOldestAgeMs қажет және оң бүтін сан болуы керек.",
                errorSpikeIncreaseRequired: "artanBy қажет және оң бүтін сан болуы керек."
            }
        }
    },
    subscriptionRequests: {
        title: "Жазылым сұраулары",
        subtitle: "Ата-ана сұраулары мен шешімдер тарихын тексеріңіз.",
        failedToLoad: "Жазылым сұраулары жүктелмеді",
        accessDeniedDescription: "Есептік жазбаңызда `subscriptions.read` құқығы жоқ.",
        totalFiltered: "Сүзгі бойынша жалпы",
        pending: "Күтуде",
        reviewCapability: "Модерация мүмкіндігі",
        queueTitle: "Сұраныс кезегі",
        queueRange: "{{from}}-{{to}} {{total}} сұрауларынан.",
        telegramLinkRequired: "Telegram сілтемесі қажет",
        telegramLinkRequiredDescription: "Қарап шығудың соңғы нүктесі `adminTgUserId` қажет. Мақұлдау/қабылдамау алдында профиліңізде Telegram-ды байланыстырыңыз.",
        reviewFailed: "Модерация қатесі",
        reviewCompleted: "Модерация аяқталды",
        resolveFailed: "Рұқсат қатесі",
        resolveCompleted: "Шешім аяқталды",
        requestMarkedAs: "{{requestId}} сұрауы {{status}} ретінде белгіленген.",
        requestMovedTo: "{{requestId}} сұрауы {{resolutionStatus}} тіліне аударылды, тұлға {{personId}}.",
        resolveHintNew: "Жұмысшының алдын ала өңдеуі күтілуде. Қолмен анықтау қол жетімді.",
        resolvePanelTitle: "Адамның сұрауына рұқсат беріңіз",
        createPerson: "Адамды жасаңыз",
        createPersonDescription: "Осы сұрау үшін жаңа адам жазбасын жасаңыз.",
        personFoundNoCreate: "Адам ЖСН арқылы табылды. Жасау сәйкестіктер болмаған кезде ғана қол жетімді.",
        findPersonByIin: "ЖСН бойынша адамды табыңыз",
        searchResults: "Іздеу нәтижелері",
        createFailed: "Жасау қатесі",
        loadFailed: "Сұраулар жүктелмеді",
        filtersDescription: "Сервер жағындағы беттеу арқылы кезек пен сұрау тарихын сүзіңіз.",
        telegramAccountNotLinked: "Telegram тіркелгісі ағымдағы әкімшімен байланысты емес.",
        noPersonsForIinQuery: "Бұл ЖСН сұрауы бойынша ешкім табылмады",
        resolvePermissionMissing: "Subscriptions.review құқығы жоқ немесе сұрау енді күтуде емес",
        resolvePanelDescriptionDesktop: "ЖСН арқылы бұрыннан бар адамды таңдаңыз немесе жаңасын жасаңыз, содан кейін сұрауды Read_for_view ішіне жіберіңіз.",
        resolvePanelDescriptionMobile: "Осы сұрау үшін адамды таңдап, оны тексеруге дайын етіңіз.",
        rejectRequestAria: "Сұрауды қабылдамау {{requestId}}",
        approveRequestAria: "Сұрауды мақұлдау {{requestId}}",
        resolveRequestAria: "Адамға {{requestId}} сұрауына рұқсат беру"
    },
    accessEvents: {
        title: "Өткізу оқиғалары",
        subtitle: "Сәйкес келмейтін оқиғалар үшін сүзгілер, беттеу және салыстыру әрекеттері бар өту оқиғаларының ағынын аяқтаңыз.",
        accessDeniedDescription: "Есептік жазбаңызда `access_events.read` рұқсаты жоқ.",
        totalFilteredEvents: "Жалпы сүзгіленген оқиғалар",
        unmatchedOnPage: "Беттегі теңдесі жоқ",
        mappingCapability: "Карта жасау мүмкіндігі",
        mappingGranted: "access_events.map шығарылды",
        eventsStream: "Оқиға ағыны",
        eventsRange: "{{total}} оқиғаларынан {{from}}-{{to}}.",
        failedToLoad: "Өту оқиғалары жүктелмеді",
        noEventsForFilters: "Таңдалған сүзгілер арқылы өтетін оқиғалар жоқ.",
        mappingRestricted: "Карталау шектеулі",
        mappingRestrictedDescription: "Сәйкес келмейтін оқиғаларды көре аласыз, бірақ байланыстыру үшін сізге `access_events.map` рұқсат қажет.",
        filtersDescription: "Таңдауыңызды күй, бағыт, құрылғы және идентификаторлар бойынша тарылтыңыз.",
        deviceIdPlaceholder: "Құрылғы идентификаторы",
        occurredAt: "Оқиға уақыты",
        person: "Адам",
        action: "Әрекет",
        dirShort: "Мысалы.",
        diagShort: "Диагностика",
        diagnostics: "Диагностика",
        attempts: "Әрекеттер",
        error: "Қате",
        none: "жоқ",
        diagnosticsForEventAria: "{{eventId}} оқиғасының диагностикасы",
        mappingOnlyForUnmatched: "Карталау тек UNMATCHED мәртебесі бар оқиғалар үшін қол жетімді.",
        mapTerminalIdentity: "Терминал идентификациясын сәйкестендіріңіз",
        mapTerminalIdentityDescription: "Терминалдағы адам идентификаторын белгілі адамға байланыстырыңыз және қайта өңдеуге сәйкес келмейтін оқиғаларды жіберіңіз.",
        mapTerminalIdentityDescriptionMobile: "Адамды тауып, сәйкес келмейтін оқиғаларға рұқсат беру үшін терминал идентификаторын байланыстырыңыз.",
        mapEventAria: "Карта оқиғасы {{eventId}}",
        findPersonByIin: "ЖСН бойынша адамды табыңыз",
        personSearchResults: "Адамды іздеу нәтижелері",
        personDeviceMappings: "Құрылғы бойынша адамды салыстыру",
        deviceMappingsLoaded: "Құрылғы салыстырулары жүктелді",
        mappingFailed: "Карта жасау қатесі",
        mappingCompleted: "Карталау аяқталды",
        loadPersonDevicesFailed: "Адамның құрылғылары жүктелмеді",
        searchPersonsFailed: "Адамдарды табу мүмкін болмады",
        mapTerminalIdentityFailed: "Терминал идентификаторын салыстыру сәтсіз аяқталды",
        missingMapPermission: "Оң жақта access_events.map жоқ",
        personIdRequired: "Сіз жеке куәлікті беруіңіз керек",
        terminalPersonIdRequired: "Терминал тұлғасының идентификаторын көрсету керек",
        iinQueryDigitsValidation: "ЖСН сұрауында 1-12 сан болуы керек",
        createRequiresExactIin: "Жасау үшін дәл 12 таңбалы ЖСН қажет",
        identityDetectedForDevice: "{{deviceId}} құрылғысы үшін байланыстырылған терминал идентификаторы табылды. Өріс автоматты түрде толтырылады.",
        identityNoMappingForDevice: "Бұл адамның салыстырулары бар, бірақ {{deviceId}} құрылғысы үшін емес.",
        mappingResultTemplate: "{{status}} картасын жасау. Жаңартылған оқиғалар: {{updatedEvents}}.",
        loadingPersonDevices: "Адамның құрылғылары жүктелуде..."
    },
    devices: {
        monitoringTitle: "Құрылғы қызметінің мониторингі",
        monitoringSubtitle: "Адаптерлердің, құрылғылардың және DS шығыс жәшігінің жұмыс күйі.",
        monitoringFailed: "Бақылау жүктелмеді",
        monitoringUnavailable: "Бақылау суреті қолжетімді емес.",
        monitoringLoadFailed: "Бақылау деректері жүктелмеді",
        adaptersStale: "Бұрынғы адаптерлер",
        devicesStale: "Ескірген құрылғылар",
        outboxPending: "Шығыс қалтасында күтуде",
        outboxOldestNew: "Шығыс жәшігіндегі ең ескі жаңа",
        adaptersHealthTitle: "Адаптерлердің күйі",
        adaptersHealthDescription: "Жүрек соғу адаптері қызметтерінің күйі мен жаңалығы.",
        devicesHealthTitle: "Құрылғы күйі",
        devicesHealthDescription: "Соңғы оқиғаның маркері және құрылғылар үшін ескіргенін анықтау.",
        outboxDescription: "Device Service ішіндегі жеткізу кезегінің күйі.",
        pendingOutboxDetected: "Күтудегі шығыс жәшік элементтері анықталды",
        oldestPendingItem: "Ең ескі күтудегі элемент: {{value}}",
        noValue: "n/a",
        accessDeniedDescription: "Есептік жазбаңызда `devices.read` рұқсаты жоқ.",
        opsTitle: "Құрылғы операциялары",
        opsSubtitle: "Адаптер арналарына байланысты құрылғыларды басқарыңыз және жұмыс күйін бақылаңыз.",
        opsPageLoadFailedTitle: "Құрылғылар жүктелмеді",
        opsLoadFailed: "Құрылғылар жүктелмеді",
        totalDevices: "Жалпы құрылғылар",
        enabled: "енгізілген",
        writableScope: "Құқықтарды өзгерту",
        writeGranted: "құрылғылар.жазу шығарылды",
        registryTitle: "Құрылғы тізілімі",
        registryDescription: "Метадеректерді өңдеңіз, күйді ауыстырыңыз және ескі құрылғыларды жойыңыз.",
        searchDeviceIdAdapter: "Құрылғы, идентификатор, адаптер бойынша іздеу",
        allAdapters: "Барлық адаптерлер",
        range: "{{total}} құрылғыларынан {{from}}-{{to}}.",
        restrictedModeTitle: "Шектеулі режим",
        restrictedModeDescription: "Құрылғыларды көре аласыз, бірақ өзгертулер `devices.write` рұқсатын талап етеді.",
        cannotUpdateState: "Құрылғы күйін жаңарту мүмкін болмады",
        cannotDeleteDevice: "Құрылғыны жою мүмкін болмады",
        updated: "Жаңартылған",
        noDevicesRegistered: "Құрылғылар әлі тіркелмеген.",
        noActiveAdapterInstances: "Белсенді адаптер даналары жоқ",
        toggleAria: "{{name}} ауыстырып қосу",
        confirm: "Растау",
        adaptersLoadFailed: "Адаптерлер жүктелмеді",
        adaptersPageLoadFailedTitle: "Адаптерлер жүктелмеді",
        adaptersOpsTitle: "Адаптерлермен операциялар",
        adaptersOpsSubtitle: "Адаптерлердің жұмыс күйі, режимі және метадеректері үшін тек оқуға арналған режим.",
        totalAdapters: "Жалпы адаптерлер",
        activeMode: "Белсенді режим",
        drainingMode: "Ағызу режимі",
        searchInstanceVendorUrl: "Дана, сатушы, url бойынша іздеу",
        allModes: "Барлық режимдер",
        active: "Белсенді",
        draining: "Draining",
        adaptersRange: "{{from}}-{{to}} бастап {{total}}",
        instanceKey: "Дана кілті",
        baseUrl: "Негізгі URL",
        retention: "Сақтау",
        capabilities: "Мүмкіндіктер",
        notDeclared: "көрсетілмеген",
        version: "Нұсқа",
        registered: "Тіркелген",
        noAdaptersRegistered: "Адаптерлер тіркелмеген",
        noAdaptersRegisteredDescription: "Құрылғы қызметі әлі ешқандай адаптерді тіркеу туралы хабарлаған жоқ.",
        panel: {
            createTitle: "Құрылғы жасаңыз",
            editTitle: "Құрылғыны өңдеу",
            createDescription: "Құрылғыңызды тіркеп, оны адаптермен жұптаңыз.",
            editDescription: "Құрылғы метадеректерін және операциялық параметрлерін жаңартыңыз.",
            addDevice: "Құрылғыны қосыңыз",
            add: "қосу",
            edit: "Өңдеу",
            editAria: "{{value}} өңдеу"
        },
        form: {
            cannotSaveTitle: "Құрылғыны сақтау мүмкін болмады",
            deviceId: "Құрылғы идентификаторы",
            deviceSettings: "Құрылғы параметрлері",
            schemaDriven: "Схема бойынша",
            rawJson: "Raw JSON",
            noSchemaHint: "Адаптер конфигурация схемасын жарияламады. JSON қолмен көрсетіңіз.",
            noAdaptersHint: "Адаптерлер табылмады. Алдымен адаптер данасын Device Operations қолданбасында тіркеңіз.",
            activeInstances: "Белсенді инстанциялар: {{value}}",
            createDevice: "Құрылғы жасаңыз",
            placeholders: {
                deviceId: "door-1",
                name: "Негізгі кіреберіс",
                selectDirection: "Бағытты таңдаңыз",
                selectAdapterVendor: "Адаптер жеткізушісін таңдаңыз",
                settingsJson: "{\"zone\":\"A\"}"
            },
            errors: {
                checkSettings: "Құрылғы параметрлері өрістерін тексеріп, әрекетті қайталаңыз.",
                operationFailed: "Операция сәтсіз аяқталды"
            }
        },
        settings: {
            hintAria: "{{label}} үшін кеңес",
            required: "міндетті түрде",
            optional: "міндетті емес",
            noItemsYet: "Тізім әлі бос.",
            noTemplateFields: "Үлгі өрістері әлі жоқ.",
            removeItemAria: "Элементті жою",
            addItem: "Элемент қосу",
            addTemplateField: "Үлгі өрісін қосыңыз",
            propertyName: "Меншік атауы",
            addMapping: "Карталауды қосыңыз",
            toggleValue: "Мәнді ауыстыру",
            placeholders: {
                selectValue: "Мәнді таңдаңыз",
                value: "Мағынасы",
                fieldKey: "Өріс пернесі",
                identityValueTemplate: "{{identityValue}}",
                mappingName: "iin",
                requiredValue: "Қажетті мән",
                optionalValue: "Қосымша мән"
            }
        },
        sort: {
            updatedNewest: "Жаңартылған: алдымен жаңа",
            updatedOldest: "Жаңартылған: алдымен ескілері",
            lastSeenNewest: "Соңғы жүрек соғуы: алдымен жаңалары",
            lastSeenOldest: "Соңғы жүрек соғуы: алдымен ескілер",
            nameAsc: "Аты-жөні: A-Z",
            nameDesc: "Аты-жөні: Y-A"
        }
    },
    permissions: {
        labels: {
            "admin.manage": "Әкімшілерді басқару",
            "devices.read": "Құрылғыларды көру",
            "devices.write": "Құрылғыларды басқару",
            "subscriptions.read": "Жазылымдарды көру",
            "subscriptions.review": "Жазылымдарды қарау",
            "subscriptions.manage": "Жазылымдарды басқару",
            "access_events.read": "Қолжетімділік оқиғаларын көру",
            "access_events.map": "Қолжетімділік оқиғаларын байланыстыру",
            "persons.read": "Адамдарды көру",
            "persons.write": "Адамдарды басқару",
            "settings.read": "Баптауларды көру",
            "settings.write": "Баптауларды басқару",
            "monitoring.read": "Мониторингті көру",
            "retention.manage": "Деректерді сақтау мерзімін басқару"
        }
    },
    enums: {
        adminStatus: {
            pending: "pending",
            active: "active",
            disabled: "disabled"
        },
        monitoringStatus: {
            all: "Барлық күйлер",
            ok: "OK",
            stale: "Ескірген",
            down: "Қолжетімсіз"
        },
        direction: {
            all: "Барлық бағыттар",
            IN: "Жүйеге кіру",
            OUT: "Шығу"
        },
        order: {
            newest: "Алдымен жаңалары",
            oldest: "Алдымен ескілер"
        },
        subscriptionStatus: {
            all: "Барлығы",
            pending: "Күтуде",
            approved: "Бекітілді",
            rejected: "Қабылданбады",
            not_pending: "Күту емес"
        },
        subscriptionResolution: {
            all: "Барлығы",
            new: "Жаңа",
            ready_for_review: "Модерацияға дайын",
            needs_person: "Адамды талап етеді"
        },
        accessEventStatus: {
            all: "Барлық күйлер",
            NEW: "Жаңа",
            PROCESSING: "Өңдеуде",
            PROCESSED: "Өңделді",
            FAILED_RETRY: "Қайталау қатесі",
            UNMATCHED: "Сәйкестік жоқ",
            ERROR: "Қате"
        }
    },
    fallback: {
        dashboard: "Бақылау тақтасы",
        reload: "Қайта жүктеу",
        skipToContent: "Мазмұнға өту",
        pageNotFoundTitle: "Бет табылмады",
        pageNotFoundDescription: "Бет жоқ немесе жылжытылған.",
        unavailableTitle: "Бэк-энд қолжетімсіз",
        unavailableDescription: "API-ге қосылу мүмкін емес. Backend және API негізгі URL мекенжайын тексеріңіз.",
        errorTitle: "Бірдеңе дұрыс болмады",
        errorDescription: "Күтпеген қолданба қатесі. Қайтадан байқап көріңіз."
    },
    errors: {
        invalid_credentials: "Жарамсыз электрондық пошта немесе құпия сөз.",
        current_password_invalid: "Ағымдағы құпия сөз дұрыс емес.",
        admin_disabled: "Әкімші тіркелгісі өшірілді.",
        admin_invite_not_found: "Шақыру сілтемесі жарамсыз.",
        admin_invite_expired: "Шақыру мерзімі аяқталды. Жаңасын сұраңыз.",
        admin_invite_used: "Шақыру әлдеқашан қолданылған.",
        admin_invite_email_mismatch: "Электрондық пошта шақыруға сәйкес келмейді.",
        admin_email_exists: "Бұл электрондық поштасы бар әкімші бұрыннан бар.",
        role_not_found: "Шақыру рөлі енді қолжетімді емес.",
        password_reset_not_found: "Қалпына келтіру сілтемесі жарамсыз.",
        password_reset_expired: "Қалпына келтіру сілтемесінің мерзімі аяқталды. Жаңасын сұраңыз.",
        password_reset_used: "Қалпына келтіру сілтемесі бұрыннан қолданылған.",
        admin_not_found: "Әкімші тіркелгісі табылмады.",
        admin_tg_not_linked: "Бұл әкімшінің электрондық поштасы Telegram-ға байланысты емес.",
        admin_tg_link_expired: "Telegram кодының мерзімі бітті. Жаңасын сұраңыз.",
        admin_tg_link_used: "Telegram коды бұрыннан қолданылған. Жаңасын сұраңыз.",
        admin_tg_code_purpose_mismatch: "Қате Telegram коды.",
        telegram_delivery_unavailable: "Қазіргі уақытта Telegram кодын жіберу мүмкін емес. Тағы жасауды сәл кейінірек көріңізді өтінеміз.",
        first_admin_already_exists: "Жүйе әлдеқашан инициализацияланған. Кіруді пайдаланыңыз.",
        server_unreachable: "Серверге қосылу мүмкін емес. Тағы жасауды сәл кейінірек көріңізді өтінеміз."
    }
} as const;



