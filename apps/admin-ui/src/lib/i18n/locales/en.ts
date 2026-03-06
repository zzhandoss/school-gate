export const enCommon = {
    app: {
        brand: {
            schoolGate: "School Gate",
            adminUi: "Admin UI"
        },
        nav: {
            main: "Main",
            monitoring: "Monitoring",
            administration: "Administration",
            deviceOperations: "Device Operations",
            dashboard: "Dashboard",
            subscriptionRequests: "Subscription Requests",
            accessEvents: "Access Events",
            persons: "Persons",
            alerts: "Alerts",
            auditLogs: "Audit Logs",
            settings: "Settings",
            import: "Import",
            admins: "Admins",
            roles: "Roles",
            devices: "Devices",
            adapters: "Adapters",
            dsMonitoring: "DS Monitoring",
            profile: "Profile"
        },
        shell: {
            signedInAs: "Signed in as",
            role: "Role",
            operationsOverview: "Operations overview",
            openMenu: "Open menu",
            closeMenu: "Close menu",
            expandSidebar: "Expand desktop sidebar",
            collapseSidebar: "Collapse desktop sidebar",
            breadcrumb: "Breadcrumb",
            language: "Language",
            signOut: "Sign out",
            signingOut: "Signing out...",
            goBack: "Go back"
        },
        language: {
            title: "Interface language",
            description: "Choose language for admin interface labels and messages.",
            ru: "Russian",
            en: "English",
            kz: "Kazakh"
        }
    },
    settings: {
        accessDeniedTitle: "Access denied",
        accessDeniedDescription: "Your account does not have `settings.read` permission.",
        loadFailedTitle: "Settings failed to load",
        runtimeTitle: "Runtime settings",
        runtimeDescription: "Tune polling, retention, monitoring, and notification defaults by section.",
        writable: "Writable",
        readOnly: "Read-only",
        refreshTab: "Refresh tab",
        sectionUpdated: "Section updated.",
        loadFailed: "Failed to load settings",
        saveFailed: "Failed to save section",
        changed: "Changed",
        clean: "Clean",
        enabled: "Enabled",
        disabled: "Disabled",
        saveFailedTitle: "Save failed",
        savedTitle: "Saved",
        resetSection: "Reset section",
        saving: "Saving...",
        saveSection: "Save section",
        meta: {
            effective: "effective",
            db: "db",
            env: "env",
            updated: "updated",
            notOverridden: "not overridden",
            never: "never"
        },
        groups: {
            worker: {
                title: "Worker",
                description: "Core worker polling and batching behavior.",
                fields: {
                    pollMs: {
                        label: "Poll (ms)",
                        hint: "Interval between polling cycles."
                    },
                    batch: {
                        label: "Batch size",
                        hint: "Items per cycle."
                    },
                    autoResolvePersonByIin: {
                        label: "Auto-resolve by IIN",
                        hint: "Enable automatic identity matching by IIN."
                    }
                }
            },
            outbox: {
                title: "Outbox",
                description: "Delivery retries and lease strategy for outbox events.",
                fields: {
                    pollMs: {
                        label: "Poll (ms)",
                        hint: "Outbox polling interval."
                    },
                    batch: {
                        label: "Batch size",
                        hint: "Rows processed per cycle."
                    },
                    maxAttempts: {
                        label: "Max attempts",
                        hint: "Retry attempts before permanent error."
                    },
                    leaseMs: {
                        label: "Lease (ms)",
                        hint: "Processing lease timeout."
                    },
                    processingBy: {
                        label: "Processing by",
                        hint: "Worker identifier for ownership."
                    }
                }
            },
            accessEvents: {
                title: "Access events",
                description: "Processing queue behavior for access events.",
                fields: {
                    pollMs: {
                        label: "Poll (ms)",
                        hint: "Polling interval for events queue."
                    },
                    batch: {
                        label: "Batch size",
                        hint: "Events processed per cycle."
                    },
                    retryDelayMs: {
                        label: "Retry delay (ms)",
                        hint: "Delay before retrying failed events."
                    },
                    leaseMs: {
                        label: "Lease (ms)",
                        hint: "Processing lease timeout."
                    },
                    maxAttempts: {
                        label: "Max attempts",
                        hint: "Retry attempts before permanent error."
                    },
                    processingBy: {
                        label: "Processing by",
                        hint: "Worker identifier for ownership."
                    }
                }
            },
            retention: {
                title: "Retention",
                description: "Cleanup schedules and data retention windows.",
                fields: {
                    pollMs: {
                        label: "Poll (ms)",
                        hint: "Cleanup scheduler interval."
                    },
                    batch: {
                        label: "Batch size",
                        hint: "Rows removed per cleanup cycle."
                    },
                    accessEventsDays: {
                        label: "Access events (days)",
                        hint: "Retention window for access events."
                    },
                    auditLogsDays: {
                        label: "Audit logs (days)",
                        hint: "Retention window for audit logs."
                    }
                }
            },
            monitoring: {
                title: "Monitoring",
                description: "Worker heartbeat freshness thresholds.",
                fields: {
                    workerTtlMs: {
                        label: "Worker TTL (ms)",
                        hint: "Threshold before worker is marked stale."
                    }
                }
            },
            notifications: {
                title: "Notifications",
                description: "Notification template and freshness thresholds.",
                fields: {
                    parentTemplate: {
                        label: "Parent template",
                        hint: "Template used for parent notifications."
                    },
                    parentMaxAgeMs: {
                        label: "Parent max age (ms)",
                        hint: "Do not send parent notifications older than this age."
                    },
                    alertMaxAgeMs: {
                        label: "Alert max age (ms)",
                        hint: "Do not send alert notifications older than this age."
                    }
                }
            }
        },
        validation: {
            positiveInteger: "{{field}} must be a positive integer.",
            required: "{{field}} cannot be empty."
        }
    },
    common: {
        actions: {
            refresh: "Refresh",
            refreshing: "Refreshing...",
            reset: "Reset",
            applyFilters: "Apply filters",
            close: "Close",
            cancel: "Cancel",
            search: "Search",
            searching: "Searching...",
            create: "Create",
            creating: "Creating...",
            map: "Map identity",
            mapping: "Mapping...",
            resolve: "Resolve person",
            resolving: "Resolving...",
            approveRequest: "Approve request",
            rejectRequest: "Reject request",
            showFilters: "Show filters",
            hideFilters: "Hide filters"
        },
        selected: "selected",
        filters: {
            title: "Filters",
            appliedCount: "Applied: {{count}}",
            noFilters: "No filters",
            pageSize: "Page size",
            status: "Status",
            direction: "Direction",
            resolution: "Resolution",
            order: "Order"
        },
        pagination: {
            range: "{{from}}-{{to}} of {{total}}",
            perPage_one: "{{count}} per page",
            perPage_other: "{{count}} per page"
        },
        labels: {
            iin: "IIN",
            telegram: "Telegram",
            personId: "Person ID",
            requestId: "Request ID",
            currentStatus: "Current status",
            eventId: "Event ID",
            device: "Device",
            created: "Created",
            actions: "Actions",
            name: "Name",
            adapter: "Adapter",
            instance: "Instance",
            vendor: "Vendor",
            mode: "Mode",
            ttl: "TTL",
            lastSeen: "Last seen",
            lastEvent: "Last event",
            outbox: "Outbox",
            resolution: "Resolution",
            status: "Status",
            direction: "Direction",
            terminal: "Terminal",
            id: "id",
            firstName: "First name",
            lastName: "Last name"
        },
        placeholders: {
            email: "admin@example.com",
            displayName: "Your display name",
            searchAdapter: "Search adapter",
            searchDevice: "Search device",
            searchIinPrefix: "12-digit IIN or prefix",
            personUuid: "person UUID",
            terminalPersonId: "terminal person id",
            optional: "Optional",
            actorId: "Actor ID",
            auditAction: "Action",
            entityType: "Entity type",
            entityId: "Entity ID"
        },
        empty: {
            noRequestsForFilter: "No requests found for current filter.",
            noAdapterTelemetry: "No adapter telemetry yet.",
            noDeviceTelemetry: "No device telemetry yet.",
            noPersonsByIin: "No persons found by this IIN query",
            noSearchResults: "No search results.",
            noMatches: "No matches found."
        }
    },
    ui: {
        close: "Close",
        toggleSidebar: "Toggle sidebar",
        pagination: {
            navigation: "Pagination",
            previous: "Previous",
            previousAria: "Go to previous page",
            next: "Next",
            nextAria: "Go to next page",
            morePages: "More pages"
        }
    },
    validation: {
        emailInvalid: "Enter a valid email address",
        passwordRequired: "Password is required",
        confirmPasswordRequired: "Confirm your password",
        nameTooLong: "Name is too long",
        passwordsDoNotMatch: "Passwords do not match",
        telegramCodeInvalid: "Enter 6-digit code"
    },
    auth: {
        common: {
            password: "Password",
            confirmPassword: "Confirm password",
            nameOptional: "Name (optional)",
            backToSignIn: "Back to sign in",
            goToSignIn: "Go to sign in"
        },
        login: {
            title: "Admin sign in",
            subtitle: "Use password or Telegram OTP to open the operations dashboard.",
            methods: {
                password: "Password",
                telegram: "Telegram"
            },
            forgotPassword: "Forgot password?",
            signIn: "Sign in",
            signingIn: "Signing in...",
            sendingCode: "Sending code...",
            sendCodeToTelegram: "Send code to Telegram",
            telegramCode: "6-digit code",
            codeExpiresAt: "Code expires at {{value}}.",
            changeEmail: "Change email",
            resendCode: "Resend code",
            verifying: "Verifying...",
            telegramLoginTitle: "Telegram login",
            authFailedTitle: "Authentication failed",
            notice: {
                codeSent: "Code sent to linked Telegram. Enter 6 digits to continue."
            },
            errors: {
                unexpectedLogin: "Unexpected error during login",
                unexpectedRequestTelegram: "Unexpected error while requesting Telegram code",
                unexpectedTelegramLogin: "Unexpected error during Telegram login"
            },
            hero: {
                protected: "Protected admin access",
                title: "Operations center for School Gate",
                description: "Monitor workers, queues, and incoming subscription requests from one control panel."
            }
        },
        firstAdmin: {
            title: "Initialize first admin",
            subtitle: "Use this once to bootstrap access for an empty system.",
            create: "Create first admin",
            creating: "Creating admin...",
            bootstrapFailedTitle: "Bootstrap failed",
            placeholders: {
                email: "root@example.com"
            },
            hero: {
                oneTimeSetup: "One-time setup",
                title: "First admin gets super admin access",
                description: "When initialization succeeds, you are signed in immediately and redirected to dashboard.",
                emptySystemsOnly: "Available only for empty systems",
                strongCredentials: "Use strong credentials for production"
            }
        },
        invite: {
            missingTitle: "Invite link is missing",
            missingDescription: "The invite token was not found in this URL. Ask your administrator for a new invite link.",
            title: "Complete invite registration",
            subtitle: "Finish account setup and continue directly to the dashboard.",
            complete: "Complete registration",
            completing: "Completing registration...",
            registrationFailedTitle: "Registration failed",
            hero: {
                onboarding: "Invite onboarding",
                title: "One step left to access the admin console",
                description: "After registration, the system signs you in automatically and opens the dashboard.",
                validated: "Invite token already validated on submit"
            }
        },
        passwordResetRequest: {
            title: "Request password reset",
            subtitle: "Enter your admin email. If account exists, reset instructions will be issued.",
            send: "Send reset request",
            sending: "Sending reset request...",
            requestFailedTitle: "Request failed",
            requestAcceptedTitle: "Request accepted",
            requestAcceptedDescription: "If the account exists, a reset token is now active.",
            devTokenPrefix: "Dev token:",
            openConfirmPage: "open confirm page",
            hero: {
                recovery: "Account recovery",
                title: "Recover admin access",
                description: "Reset links are one-time and expire automatically.",
                emailHint: "Use only trusted admin email"
            }
        },
        passwordResetConfirm: {
            missingTitle: "Reset token is missing",
            missingDescription: "Open this page from a valid reset link or request a new password reset token.",
            requestNewToken: "Request new reset token",
            title: "Set a new password",
            subtitle: "Choose your new admin password and sign in again.",
            newPassword: "New password",
            confirmNewPassword: "Confirm new password",
            failedTitle: "Password reset failed",
            save: "Set new password",
            saving: "Saving new password...",
            hero: {
                secureReset: "Secure reset",
                title: "Password changed immediately",
                description: "After successful reset you can sign in with the new password.",
                tokenProtection: "One-time token protection"
            }
        }
    },
    dashboard: {
        title: "Operations dashboard",
        subtitle: "Last snapshot: {{value}}",
        workerHealth: "Worker health",
        queuePressure: "Queue pressure",
        componentStatus: "Component status",
        riskSummary: "Risk summary",
        staleWorkers_one: "{{count}} worker stale",
        staleWorkers_other: "{{count}} workers stale",
        componentsDown_one: "{{count}} component down",
        componentsDown_other: "{{count}} components down",
        allHealthy: "All healthy",
        operational: "Operational",
        staleCount: "{{count}} stale",
        downCount: "{{count}} down",
        workersTracked: "{{count}} workers tracked",
        totalComponents: "Total components: {{count}}",
        monitoringWidgetUnavailable: "Monitoring widget unavailable",
        requestsWidgetUnavailable: "Requests widget unavailable",
        requestsTitle: "Recent subscription requests",
        requestsDescription: "Latest incoming requests needing review",
        noRequests: "No requests found.",
        noWidgetsTitle: "No available widgets",
        noWidgetsDescription: "No dashboard widgets are available for your current permission scope.",
        reviewCapabilityGranted: "subscriptions.review granted",
        readOnly: "Read-only"
    },
    monitoring: {
        accessDeniedDescription: "Your account does not have `monitoring.read` permission.",
        accessEventsNew: "access_events.NEW",
        outboxNew: "outbox.new",
        oldestUnprocessed: "Oldest unprocessed: {{value}}",
        workersTableCaption: "Global worker health and heartbeat freshness.",
        componentsTableCaption: "Global component health and diagnostic state.",
        worker: "Worker",
        component: "Component",
        lastError: "Last error",
        checked: "Checked",
        error: "Error"
    },
    personHover: {
        openProfile: "Open profile"
    },
    profile: {
        account: "Account",
        subtitle: "Manage your account details and Telegram linking for admin notifications.",
        detailsTitle: "Profile details",
        detailsDescription: "Update your personal account information.",
        email: "Email",
        saveFailedTitle: "Cannot save profile",
        savedTitle: "Saved",
        saveSuccess: "Profile updated successfully.",
        saveUnexpectedError: "Unexpected error while updating profile.",
        saveChanges: "Save changes",
        securityNoteTitle: "Security note",
        securityNoteDescription: "Profile and password updates are performed via authenticated API endpoints for the current admin.",
        password: {
            title: "Change password",
            description: "Enter current password, then new password with confirmation.",
            current: "Current password",
            new: "New password",
            confirm: "Repeat new password",
            update: "Update password",
            updating: "Updating password...",
            cannotChangeTitle: "Cannot change password",
            updatedTitle: "Password updated",
            success: {
                changed: "Password changed successfully."
            },
            errors: {
                mismatch: "New password and confirmation do not match.",
                unexpectedChange: "Unexpected error while changing password."
            }
        },
        telegram: {
            title: "Telegram link",
            description: "Link your Telegram account to receive admin bot features.",
            linkStatus: "Link status",
            linked: "Linked",
            notLinked: "Not linked",
            notLinkedHintPrefix: "Generate code and send",
            notLinkedHintSuffix: "to bot.",
            userId: "Telegram user id: {{value}}",
            generate: "Generate link code",
            generating: "Generating...",
            unlink: "Unlink Telegram",
            unlinking: "Unlinking...",
            activeCode: "Active code",
            expires: "Expires: {{value}}",
            updatedTitle: "Telegram updated",
            actionFailedTitle: "Telegram action failed",
            howToLink: "How to link",
            steps: {
                generate: "1. Generate code above.",
                openChat: "2. Open your Telegram bot chat.",
                sendPrefix: "3. Send command:",
                sendSuffix: "."
            },
            success: {
                unlinked: "Telegram account unlinked successfully."
            },
            errors: {
                generateUnexpected: "Unexpected error while generating Telegram link code.",
                unlinkUnexpected: "Unexpected error while unlinking Telegram account."
            }
        }
    },
    admins: {
        title: "Admins & access",
        subtitle: "Manage admin accounts, invite newcomers, and control role assignments.",
        accessDeniedDescription: "Your account does not have `admin.manage` permission.",
        pageLoadFailedTitle: "Admins page failed to load",
        loadFailed: "Failed to load admins",
        updateStatusFailed: "Failed to update admin status",
        updateRoleFailed: "Failed to update role",
        createResetFailed: "Failed to create reset token",
        cannotDisableLastSuperAdmin: "Cannot disable the last active super_admin",
        cannotChangeOwnRole: "Changing your own role is not allowed",
        totalAdmins: "Total admins",
        active: "Active",
        disabled: "Disabled",
        operationFailedTitle: "Operation failed",
        passwordResetGenerated: "Password reset token generated",
        tokenExpires: "Token expires",
        tokenLabel: "Token",
        resetUrlLabel: "Reset URL",
        registryTitle: "Admin registry",
        registryDescription: "Update status, change role assignments, and issue password reset links.",
        securityNoteTitle: "Security note",
        securityNoteDescription: "Invite and reset tokens are sensitive credentials. Share them only in secure channels.",
        permissionBadge: "Permission: {{permission}}",
        noAdminsFound: "No admins found.",
        table: {
            admin: "Admin",
            unnamedAdmin: "Unnamed admin",
            selectRole: "Select role",
            notLinked: "not linked",
            resetPassword: "Reset password"
        },
        invitePanel: {
            createInvite: "Create invite",
            invite: "Invite",
            sheetTitle: "Create admin invite",
            sheetDescription: "Generate secure invite token for a new admin account.",
            drawerTitle: "Create admin invite",
            drawerDescription: "Select role and expiration, then generate one-time token."
        },
        inviteForm: {
            adminEmail: "Admin email",
            roleSource: "Role source",
            existingRole: "Existing role",
            newRole: "New role",
            role: "Role",
            newRoleName: "New role name",
            permissions: "Permissions",
            expiration: "Expiration",
            inviteCreationFailedTitle: "Invite creation failed",
            inviteCreatedTitle: "Invite created",
            roleValue: "Role: {{value}}",
            expiresValue: "Expires: {{value}}",
            inviteCode: "Invite code",
            inviteLink: "Invite link",
            copyCode: "Copy code",
            copyLink: "Copy link",
            createInvite: "Create invite",
            createRoleAndInvite: "Create role + invite",
            noRoles: "No roles available yet. Create a new role.",
            placeholders: {
                chooseRole: "Choose role",
                newRoleName: "ops_manager",
                selectExpiration: "Select expiration"
            },
            presets: {
                viewer: "Viewer preset",
                operator: "Operator preset",
                admin: "Admin preset",
                hint: "Presets are shortcuts. You can still fine-tune permissions below."
            },
            expirationOptions: {
                "86400000": "24 hours",
                "259200000": "72 hours",
                "604800000": "7 days"
            },
            errors: {
                missingPermission: "Missing permission: {{permission}}",
                emailRequired: "Email is required",
                roleRequired: "Role is required",
                newRoleNameRequired: "New role name is required",
                newRolePermissionRequired: "Select at least one permission for new role",
                createRoleFailed: "Failed to create role",
                createInviteFailed: "Failed to create invite",
                copyTokenFailed: "Cannot copy invite token in this browser",
                copyLinkFailed: "Cannot copy invite link in this browser"
            }
        },
        roleForm: {
            roleName: "Role name",
            roleNameImmutable: "Role name is immutable.",
            permissions: "Permissions",
            cannotSaveTitle: "Cannot save role",
            saving: "Saving...",
            createRole: "Create role",
            savePermissions: "Save permissions",
            placeholders: {
                roleName: "ops_manager"
            },
            errors: {
                roleNameRequired: "Role name is required",
                permissionRequired: "Select at least one permission",
                saveFailed: "Failed to save role"
            }
        },
        rolePanel: {
            createTitle: "Create role",
            editTitle: "Edit {{roleName}}",
            roleFallback: "role",
            createDescription: "Define a new role and attach permissions.",
            editDescription: "Adjust permission scope for selected role.",
            createRole: "Create role",
            role: "Role",
            edit: "Edit",
            editAria: "Edit {{roleName}}"
        }
    },
    roles: {
        title: "Role management",
        subtitle: "Create roles and tune permission sets used by admin accounts.",
        pageLoadFailedTitle: "Roles page failed to load",
        loadFailed: "Failed to load roles",
        createFailed: "Failed to create role",
        updateFailed: "Failed to update role",
        operationFailedTitle: "Role operation failed",
        total: "Roles total",
        uniquePermissions: "Unique permissions",
        mostUsedPermission: "Most used permission",
        permissionsAssigned_one: "{{count}} permission assigned",
        permissionsAssigned_other: "{{count}} permissions assigned",
        noPermissionsAssigned: "No permissions assigned."
    },
    auditLogs: {
        subtitle: "Operational history with URL-persisted filters and server pagination.",
        filtersDescription: "Filter by actor, action, entity and time range.",
        accessDeniedDescription: "Your account does not have `monitoring.read` permission.",
        pageLoadFailedTitle: "Audit logs failed to load",
        loadFailed: "Failed to load audit logs",
        historyStream: "History stream",
        historyRange: "{{from}}-{{to}} of {{total}} logs.",
        noLogsForFilters: "No audit logs found for current filters.",
        table: {
            at: "At",
            actor: "Actor",
            action: "Action",
            entity: "Entity",
            meta: "Meta"
        }
    },
    persons: {
        subtitle: "Person profiles and device-scoped terminal identities.",
        accessDeniedDescription: "Your account does not have `persons.read` permission.",
        pageLoadFailedTitle: "Persons page failed to load",
        loadFailed: "Failed to load persons",
        searchByNameOrIin: "Name or IIN contains",
        mutationFailedTitle: "Mutation failed",
        range: "{{from}}-{{to}} of {{total}} persons.",
        autoMappingsFailed: "Person created, but {{count}} auto identity mappings failed.",
        createFailed: "Failed to create person",
        updateFailed: "Failed to update person",
        tableDescription: "Manage person profiles and open identities page.",
        terminalLinks: "Terminal links",
        noPersonsFound: "No persons found.",
        unknownName: "Unknown name",
        linked: "Linked",
        notLinked: "Not linked",
        open: "Open",
        loadPersonFailed: "Failed to load person",
        personPageLoadFailedTitle: "Person page failed to load",
        personNotFound: "Person was not found",
        back: "Back",
        noGlobalTerminalId: "no global terminal id",
        deviceIdentities: "Device identities",
        deviceIdentitiesDescription: "Terminal IDs are scoped by device.",
        deviceId: "Device ID",
        terminalPersonId: "Terminal Person ID",
        noIdentitiesForPerson: "No identities for this person.",
        createIdentityFailed: "Failed to create identity",
        updateIdentityFailed: "Failed to update identity",
        confirmDeleteIdentity: "Delete this identity mapping?",
        deleteIdentityFailed: "Failed to delete identity",
        deleteFailed: "Failed to delete person",
        bulkDeleteFailed: "Failed to delete selected persons",
        deleting: "Deleting...",
        delete: "Delete",
        actionCompletedTitle: "Action completed",
        deleteSummarySingle: "Person deleted successfully.",
        deleteSummaryBulk: "Deleted {{deleted}} persons. Not found: {{notFound}}. Errors: {{errors}}.",
        filters: {
            button: "Filters",
            title: "Persons filters",
            description: "Filter the list by person identity and linked terminal state.",
            searchLabel: "Name or IIN",
            linkStatusLabel: "Link status",
            deviceLabel: "Linked terminal",
            includeDevicesLabel: "Include terminals",
            excludeDevicesLabel: "Exclude terminals",
            includeDevicesPlaceholder: "Choose terminals to include",
            excludeDevicesPlaceholder: "Choose terminals to exclude",
            clearSelection: "Clear",
            allDevices: "All terminals",
            devicesLoadFailed: "Failed to load terminal list for filters.",
            linkStatus: {
                all: "All persons",
                linked: "Linked only",
                unlinked: "Not linked only"
            }
        },
        selection: {
            selected: "{{count}} selected",
            clear: "Clear selection",
            linkToTerminal: "Add to terminal",
            delete: "Delete selected",
            selectPage: "Select all persons on this page",
            selectPerson: "Select person {{iin}}"
        },
        bulkTerminalCreate: {
            title: "Add selected persons to terminals",
            description: "All selected persons will be created on the same terminals. Only validity dates are editable here.",
            datesTitle: "Validity period",
            validFrom: "Valid from",
            validTo: "Valid to",
            defaultsHint: "Terminal user ID, display name, IIN, user type, authority, and other fields use the existing default person terminal-create values.",
            devicesTitle: "Target terminals",
            noDevices: "No enabled terminals available.",
            personsTitle: "Selected persons: {{count}}",
            existingLinksTitle: "Current terminal links",
            noLinkedDevices: "No linked terminals yet.",
            previewTitle: "What will happen",
            loadingPreview: "Loading current terminal links...",
            previewLoadFailedTitle: "Failed to load link preview",
            previewLoadFailed: "Failed to load current terminal links for selected persons.",
            createBadge: "Create",
            skipBadge: "Skip",
            noTargetDevicesSelected: "Select target terminals to see the preview.",
            summaryTitle: "Write summary",
            summaryDescription: "{{persons}} persons will be created on {{devices}} selected terminals.",
            createPairsSummary: "Create pairs: {{count}}",
            skipPairsSummary: "Skip pairs: {{count}}",
            allPairsAlreadyLinked: "All selected person and terminal pairs already exist. Choose another terminal to continue.",
            submit: "Create on terminals",
            submitting: "Creating...",
            failed: "Failed to create selected persons on terminals.",
            successSummary: "Terminal create completed. Success: {{success}}. Failed: {{failed}}. Skipped: {{skipped}}."
        },
        deleteDialog: {
            singleTitle: "Delete person?",
            bulkTitle: "Delete selected persons?",
            singleDescription: "{{name}} will be removed from the system.",
            bulkDescription: "{{count}} selected persons will be removed from the system.",
            confirmSingle: "Delete person",
            confirmBulk: "Delete selected",
            effects: {
                identities: "Terminal identity links will be removed.",
                subscriptions: "Active subscriptions will be deactivated and kept in history.",
                requests: "Linked subscription requests will be detached. Pending ready-for-review requests will return to person resolution.",
                snapshot: "Imported terminal snapshot records and history will remain unchanged."
            }
        },
        advancedIdentityMapping: "Advanced identity mapping",
        importActions: {
            sync: "Sync terminal users"
        },
        panel: {
            createTitle: "Create person",
            editTitle: "Edit person",
            createDescription: "Create person profile in the system.",
            editDescription: "Update person data. Device identities are managed separately.",
            createPerson: "Create person",
            edit: "Edit",
            editAria: "Edit {{value}}"
        },
        form: {
            cannotSaveTitle: "Cannot save person",
            operationFailed: "Operation failed",
            iinValid: "IIN is valid.",
            iinInvalid: "Enter exactly 12 digits.",
            autoIdentitySuggestionsTitle: "Auto identity suggestions",
            autoIdentitySuggestionsDescription: "Suggestions are loaded automatically when IIN is valid. Selected entries will be applied after person creation.",
            searchingDevices: "Searching devices...",
            autoMappingsLoadFailed: "Failed to load auto mappings",
            previewDiagnostics: "eligible {{eligible}}, requests {{requests}}, errors {{errors}}",
            terminalValue: "terminal: {{value}}",
            nameValue: "name: {{value}}",
            alreadyLinked: "already linked",
            createPerson: "Create person",
            placeholders: {
                iin: "030512550123",
                firstName: "Alihan",
                lastName: "Erzhanov"
            }
        },
        identityPanel: {
            addTitle: "Add identity",
            editTitle: "Edit identity",
            addDescription: "Bind person to specific device and terminal person id.",
            editDescription: "Update device mapping for this person.",
            addIdentity: "Add identity",
            add: "Add",
            edit: "Edit",
            editAria: "Edit identity"
        },
        identityForm: {
            cannotSaveTitle: "Cannot save identity",
            operationFailed: "Operation failed",
            noDevicesHint: "No devices found. Create a device first in Device Operations.",
            autoNoMatch: "No match found in selected device.",
            autoFindFailed: "Auto find failed",
            autoFound: "Found: {{id}}",
            autoFoundWithDetails: "Found: {{id}} ({{details}})",
            autoFinding: "Auto finding...",
            autoFindInDevice: "Auto find in selected device",
            addIdentity: "Add identity",
            placeholders: {
                selectDevice: "Select device",
                noDevicesAvailable: "No devices available",
                terminalPersonId: "T-10001"
            }
        },
        autoDialog: {
            auto: "Auto",
            title: "Auto identity mapping",
            description: "Preview identity mappings for this person by IIN and apply selected entries.",
            preview: "Preview",
            previewing: "Previewing...",
            operationFailedTitle: "Operation failed",
            diagnostics: "eligible {{eligible}}, requests {{requests}}, errors {{errors}}",
            terminalValue: "terminal: {{value}}",
            nameValue: "name: {{value}}",
            sourceValue: "source: {{value}}",
            userTypeValue: "userType: {{value}}",
            scoreValue: "score: {{value}}",
            alreadyLinked: "already linked",
            applyResultTitle: "Apply result",
            applyResultDescription: "linked {{linked}}, already linked {{alreadyLinked}}, conflicts {{conflicts}}, errors {{errors}}",
            applying: "Applying...",
            applySelected: "Apply selected",
            errors: {
                previewFailed: "Failed to preview auto mappings",
                selectAtLeastOne: "Select at least one identity mapping.",
                applyFailed: "Failed to apply auto mappings"
            }
        }
    },
    alerts: {
        title: "Alerts control center",
        subtitle: "Manage rules and notification subscriptions for your account.",
        pageLoadFailedTitle: "Alerts page failed to load",
        sessionMissingAdminId: "Session is missing admin identifier.",
        loadFailed: "Failed to load alerts",
        cannotUpdateSubscription: "Cannot update subscription",
        refreshData: "Refresh data",
        triggeredNow: "Triggered now",
        criticalActive: "Critical active",
        enabledRules: "Enabled rules",
        deliveryScopeTitle: "Delivery scope",
        deliveryScopeDescription: "This page supports creating, editing, and subscribing to rules in one workflow.",
        rulesTitle: "Rules",
        rulesDescription: "Turn personal notifications on or off per rule without changing global rule config.",
        subscriptionUpdateFailedTitle: "Subscription update failed",
        limitedAccessTitle: "Limited access",
        limitedAccessDescription: "You do not have `admin.manage` permission, so subscription toggles are read-only.",
        noRulesConfigured: "No alert rules configured yet.",
        recentEvents: "Recent events",
        recentEventsDescription: "Latest alert transitions from monitoring snapshots.",
        noRecentEvents: "No alert events in recent snapshots.",
        deleteRule: "Delete",
        deletingRule: "Deleting...",
        deleteRuleFailed: "Failed to delete alert rule.",
        deleteRuleFailedTitle: "Rule delete failed",
        unknownRule: "Unknown rule",
        deleteDialog: {
            title: "Delete alert rule?",
            description: 'Rule "{{name}}" will be permanently deleted.',
            warning: "This action cannot be undone.",
            effects: {
                subscriptions: "All subscriptions for this rule will also be deleted.",
                events: "All Recent Events history linked to this rule will also be deleted."
            }
        },
        ruleId: "Rule ID",
        toggleNotificationFor: "Toggle notification for {{name}}",
        subscribed: "Subscribed",
        off: "Off",
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
            rule: "Rule",
            severity: "Severity",
            notifyMe: "Notify me",
            message: "Message",
            createdAt: "Created at"
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
            createRule: "Create rule",
            createTitle: "Create alert rule",
            createSheetDescription: "Define a rule that will generate alert events from monitoring snapshots.",
            createDrawerDescription: "Configure rule type, severity, and trigger thresholds.",
            edit: "Edit",
            editTitle: "Edit alert rule",
            editAria: "Edit {{ruleName}}",
            editSheetDescription: "Update rule metadata and thresholds without leaving alerts overview.",
            editDrawerDescription: "Update rule settings and save changes."
        },
        ruleForm: {
            ruleName: "Rule name",
            ruleType: "Rule type",
            severity: "Severity",
            status: "Status",
            initialStatus: "Initial status",
            config: "Config",
            createRule: "Create rule",
            saving: "Saving...",
            cannotCreateTitle: "Cannot create rule",
            cannotUpdateTitle: "Cannot update rule",
            placeholders: {
                ruleName: "High outbox backlog",
                selectRuleType: "Select rule type",
                selectSeverity: "Select severity"
            },
            hints: {
                workerStale: "Optionally limit by workerId.",
                outboxBacklog: "Set at least one threshold: maxNew or maxOldestAgeMs.",
                botDown: "No extra config is required.",
                accessEventLag: "maxOldestAgeMs is required.",
                errorSpike: "Source and increaseBy are required.",
                deviceServiceDown: "No extra config is required.",
                adapterDown: "Optionally scope by adapterId or vendorKey."
            },
            configFields: {
                workerIdOptional: "workerId (optional)",
                source: "source",
                maxNew: "maxNew",
                maxOldestAgeMs: "maxOldestAgeMs",
                increaseBy: "increaseBy",
                adapterIdOptional: "adapterId (optional)",
                vendorKeyOptional: "vendorKey (optional)",
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
                ruleNameRequired: "Rule name is required.",
                createFailed: "Failed to create alert rule.",
                updateFailed: "Failed to update rule.",
                outboxThresholdsPositive: "Outbox thresholds must be positive integers.",
                outboxThresholdRequired: "Provide maxNew or maxOldestAgeMs for outbox backlog.",
                accessEventLagRequired: "maxOldestAgeMs is required and must be a positive integer.",
                errorSpikeIncreaseRequired: "increaseBy is required and must be a positive integer.",
                invalidConfig: "Invalid rule config."
            }
        }
    },
    subscriptionRequests: {
        title: "Subscription requests",
        subtitle: "Review parent requests and inspect historical decisions.",
        failedToLoad: "Subscription requests failed to load",
        accessDeniedDescription: "Your account does not have `subscriptions.read` permission.",
        totalFiltered: "Total filtered",
        pending: "Pending",
        reviewCapability: "Review capability",
        queueTitle: "Requests queue",
        queueRange: "{{from}}-{{to}} of {{total}} requests.",
        telegramLinkRequired: "Telegram link required",
        telegramLinkRequiredDescription: "Review endpoint requires `adminTgUserId`. Link Telegram in Profile before approving/rejecting.",
        reviewFailed: "Review action failed",
        reviewCompleted: "Review completed",
        resolveFailed: "Resolve action failed",
        resolveCompleted: "Resolve completed",
        requestMarkedAs: "Request {{requestId}} marked as {{status}}.",
        requestMovedTo: "Request {{requestId}} moved to {{resolutionStatus}} with person {{personId}}.",
        resolveHintNew: "Awaiting worker preprocessing. Manual resolve is available.",
        resolvePanelTitle: "Resolve request person",
        createPerson: "Create person",
        createPersonDescription: "Create a new person record for this subscription request.",
        personFoundNoCreate: "Person found by IIN. Creation is available only when no person was found.",
        findPersonByIin: "Find person by IIN",
        searchResults: "Search results",
        createFailed: "Create failed",
        loadFailed: "Failed to load requests",
        filtersDescription: "Filter queue and historical requests with server pagination.",
        telegramAccountNotLinked: "Telegram account is not linked for current admin.",
        noPersonsForIinQuery: "No persons found for this IIN query",
        resolvePermissionMissing: "Missing subscriptions.review permission or request is not pending",
        resolvePanelDescriptionDesktop: "Pick existing person or create one by IIN, then move request to ready_for_review.",
        resolvePanelDescriptionMobile: "Select person for this request and move it to review-ready state.",
        rejectRequestAria: "Reject request {{requestId}}",
        approveRequestAria: "Approve request {{requestId}}",
        resolveRequestAria: "Resolve person for request {{requestId}}"
    },
    accessEvents: {
        title: "Access events",
        subtitle: "Full access-event stream with filters, pagination and unmatched mapping actions.",
        accessDeniedDescription: "Your account does not have `access_events.read` permission.",
        totalFilteredEvents: "Total filtered events",
        unmatchedOnPage: "Unmatched on page",
        mappingCapability: "Mapping capability",
        mappingGranted: "access_events.map granted",
        eventsStream: "Events stream",
        eventsRange: "{{from}}-{{to}} of {{total}} events.",
        failedToLoad: "Access events failed to load",
        noEventsForFilters: "No access events found for selected filters.",
        mappingRestricted: "Mapping restricted",
        mappingRestrictedDescription: "You can inspect unmatched events, but linking requires `access_events.map` permission.",
        filtersDescription: "Narrow by status, direction, device and identity fields.",
        deviceIdPlaceholder: "Device ID",
        occurredAt: "Occurred At",
        person: "Person",
        action: "Action",
        dirShort: "Dir",
        diagShort: "Diag",
        diagnostics: "Diagnostics",
        attempts: "Attempts",
        error: "Error",
        none: "none",
        diagnosticsForEventAria: "Diagnostics for event {{eventId}}",
        mappingOnlyForUnmatched: "Mapping is available only for UNMATCHED events.",
        mapTerminalIdentity: "Map terminal identity",
        mapTerminalIdentityDescription: "Attach terminal person ID to a known person and requeue unmatched events.",
        mapTerminalIdentityDescriptionMobile: "Find person and bind terminal ID to resolve unmatched events.",
        mapEventAria: "Map event {{eventId}}",
        findPersonByIin: "Find person by IIN",
        personSearchResults: "Person search results",
        personDeviceMappings: "Person device mappings",
        deviceMappingsLoaded: "Device mappings loaded",
        mappingFailed: "Mapping failed",
        mappingCompleted: "Mapping completed",
        loadPersonDevicesFailed: "Cannot load person devices",
        searchPersonsFailed: "Cannot search persons",
        mapTerminalIdentityFailed: "Cannot map terminal identity",
        missingMapPermission: "Missing access_events.map permission",
        personIdRequired: "Person ID is required",
        terminalPersonIdRequired: "Terminal person ID is required",
        iinQueryDigitsValidation: "IIN query must contain 1-12 digits",
        createRequiresExactIin: "Create requires exact 12-digit IIN",
        identityDetectedForDevice: "Detected mapped terminal ID for device {{deviceId}}. Field was auto-filled.",
        identityNoMappingForDevice: "This person has device mappings, but none for device {{deviceId}}.",
        mappingResultTemplate: "Mapping {{status}}. Updated events: {{updatedEvents}}.",
        loadingPersonDevices: "Loading person devices..."
    },
    devices: {
        monitoringTitle: "Device service monitoring",
        monitoringSubtitle: "Operational health for adapters, devices, and DS outbox.",
        monitoringFailed: "Monitoring failed to load",
        monitoringUnavailable: "Monitoring snapshot is unavailable.",
        monitoringLoadFailed: "Failed to load monitoring data",
        adaptersStale: "Adapters stale",
        devicesStale: "Devices stale",
        outboxPending: "Outbox pending",
        outboxOldestNew: "Outbox oldest new",
        adaptersHealthTitle: "Adapters health",
        adaptersHealthDescription: "Status and heartbeat freshness of adapter services.",
        devicesHealthTitle: "Devices health",
        devicesHealthDescription: "Last ingested event marker and stale detection per device.",
        outboxDescription: "Delivery queue state inside Device Service.",
        pendingOutboxDetected: "Pending outbox items detected",
        oldestPendingItem: "Oldest pending item: {{value}}",
        noValue: "n/a",
        accessDeniedDescription: "Your account does not have `devices.read` permission.",
        opsTitle: "Device operations",
        opsSubtitle: "Manage devices mapped to adapter channels and monitor operational state.",
        opsPageLoadFailedTitle: "Devices failed to load",
        opsLoadFailed: "Failed to load devices",
        totalDevices: "Total devices",
        enabled: "Enabled",
        writableScope: "Writable scope",
        writeGranted: "devices.write granted",
        registryTitle: "Devices registry",
        registryDescription: "Edit metadata, toggle state, and remove obsolete devices.",
        searchDeviceIdAdapter: "Search device, id, adapter",
        allAdapters: "All adapters",
        range: "{{from}}-{{to}} of {{total}} devices.",
        restrictedModeTitle: "Restricted mode",
        restrictedModeDescription: "You can view devices, but mutations require `devices.write` permission.",
        cannotUpdateState: "Cannot update device state",
        cannotDeleteDevice: "Cannot delete device",
        updated: "Updated",
        noDevicesRegistered: "No devices registered yet.",
        noActiveAdapterInstances: "No active adapter instances",
        toggleAria: "Toggle {{name}}",
        confirm: "Confirm",
        adaptersLoadFailed: "Failed to load adapters",
        adaptersPageLoadFailedTitle: "Adapters failed to load",
        adaptersOpsTitle: "Adapters operations",
        adaptersOpsSubtitle: "Read-only operational view for adapter status, mode, and metadata.",
        totalAdapters: "Total adapters",
        activeMode: "Active mode",
        drainingMode: "Draining mode",
        searchInstanceVendorUrl: "Search instance, vendor, url",
        allModes: "All modes",
        active: "Active",
        draining: "Draining",
        adaptersRange: "{{from}}-{{to}} of {{total}}",
        instanceKey: "Instance key",
        baseUrl: "Base URL",
        retention: "Retention",
        capabilities: "Capabilities",
        notDeclared: "not declared",
        version: "Version",
        registered: "Registered",
        noAdaptersRegistered: "No adapters registered",
        noAdaptersRegisteredDescription: "Device service has not reported any adapter registrations yet.",
        panel: {
            createTitle: "Create device",
            editTitle: "Edit device",
            createDescription: "Register a device and link it to an adapter.",
            editDescription: "Update device metadata and operational settings.",
            addDevice: "Add device",
            add: "Add",
            edit: "Edit",
            editAria: "Edit {{value}}"
        },
        form: {
            cannotSaveTitle: "Cannot save device",
            deviceId: "Device ID",
            deviceSettings: "Device settings",
            schemaDriven: "Schema-driven",
            rawJson: "Raw JSON",
            noSchemaHint: "Adapter has no declared settings schema. Provide JSON manually.",
            noAdaptersHint: "No adapters found. Register adapter instance first in Device Operations.",
            activeInstances: "Active instances: {{value}}",
            createDevice: "Create device",
            placeholders: {
                deviceId: "door-1",
                name: "Main entry",
                selectDirection: "Select direction",
                selectAdapterVendor: "Select adapter vendor",
                settingsJson: "{\"zone\":\"A\"}"
            },
            errors: {
                checkSettings: "Check device settings fields and try again.",
                operationFailed: "Operation failed"
            }
        },
        settings: {
            hintAria: "Hint for {{label}}",
            required: "required",
            optional: "optional",
            noItemsYet: "No items yet.",
            noTemplateFields: "No template fields yet.",
            removeItemAria: "Remove item",
            addItem: "Add item",
            addTemplateField: "Add template field",
            propertyName: "Property name",
            addMapping: "Add mapping",
            toggleValue: "Toggle value",
            placeholders: {
                selectValue: "Select value",
                value: "Value",
                fieldKey: "Field key",
                identityValueTemplate: "{{identityValue}}",
                mappingName: "iin",
                requiredValue: "Required value",
                optionalValue: "Optional value"
            }
        },
        sort: {
            updatedNewest: "Updated: newest",
            updatedOldest: "Updated: oldest",
            lastSeenNewest: "Last seen: newest",
            lastSeenOldest: "Last seen: oldest",
            nameAsc: "Name: A-Z",
            nameDesc: "Name: Z-A"
        }
    },
    permissions: {
        labels: {
            "admin.manage": "Manage admins",
            "devices.read": "View devices",
            "devices.write": "Manage devices",
            "subscriptions.read": "View subscriptions",
            "subscriptions.review": "Review subscriptions",
            "subscriptions.manage": "Manage subscriptions",
            "access_events.read": "View access events",
            "access_events.map": "Map access events",
            "persons.read": "View persons",
            "persons.write": "Manage persons",
            "settings.read": "View settings",
            "settings.write": "Manage settings",
            "monitoring.read": "View monitoring",
            "retention.manage": "Manage retention"
        }
    },
    enums: {
        adminStatus: {
            pending: "pending",
            active: "active",
            disabled: "disabled"
        },
        monitoringStatus: {
            all: "All statuses",
            ok: "OK",
            stale: "Stale",
            down: "Down"
        },
        direction: {
            all: "All directions",
            IN: "IN",
            OUT: "OUT"
        },
        order: {
            newest: "Newest",
            oldest: "Oldest"
        },
        subscriptionStatus: {
            all: "All",
            pending: "Pending",
            approved: "Approved",
            rejected: "Rejected",
            not_pending: "Not pending"
        },
        subscriptionResolution: {
            all: "All",
            new: "New",
            ready_for_review: "Ready for review",
            needs_person: "Needs person"
        },
        accessEventStatus: {
            all: "All statuses",
            NEW: "New",
            PROCESSING: "Processing",
            PROCESSED: "Processed",
            FAILED_RETRY: "Failed retry",
            UNMATCHED: "Unmatched",
            ERROR: "Error"
        }
    },
    fallback: {
        dashboard: "Dashboard",
        reload: "Reload",
        skipToContent: "Skip to content",
        pageNotFoundTitle: "Page not found",
        pageNotFoundDescription: "The page does not exist or has been moved.",
        unavailableTitle: "Backend unavailable",
        unavailableDescription: "Cannot reach the API server. Check backend health and API base URL.",
        errorTitle: "Something went wrong",
        errorDescription: "Unexpected application error. Please try again."
    },
    errors: {
        invalid_credentials: "Invalid email or password.",
        current_password_invalid: "Current password is incorrect.",
        admin_disabled: "Your admin account is disabled.",
        admin_invite_not_found: "Invite link is invalid.",
        admin_invite_expired: "Invite has expired. Request a new one.",
        admin_invite_used: "Invite has already been used.",
        admin_invite_email_mismatch: "Email does not match this invite.",
        admin_email_exists: "Admin with this email already exists.",
        role_not_found: "Invite role is no longer available.",
        password_reset_not_found: "Reset link is invalid.",
        password_reset_expired: "Reset link has expired. Request a new one.",
        password_reset_used: "Reset link has already been used.",
        admin_not_found: "Admin account not found.",
        admin_tg_not_linked: "This admin email is not linked to Telegram.",
        admin_tg_link_expired: "Telegram code has expired. Request a new one.",
        admin_tg_link_used: "Telegram code was already used. Request a new one.",
        admin_tg_code_purpose_mismatch: "Invalid Telegram code.",
        telegram_delivery_unavailable: "Cannot send Telegram code right now. Try again later.",
        first_admin_already_exists: "System is already initialized. Use sign in instead.",
        server_unreachable: "Cannot connect to server. Please try again later."
    }
} as const;


