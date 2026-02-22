export { DomainError } from "./errors/domainError.js";
import { DomainError } from "./errors/domainError.js";

export class InvalidIinError extends DomainError {
    constructor() {
        super("IIN_INVALID", "Invalid IIN format");
    }
}

export class PendingRequestAlreadyExistsError extends DomainError {
    constructor() {
        super("SUBSCRIPTION_REQUEST_PENDING_ALREADY_EXISTS", "Pending request already exists");
    }
}

export class SubscriptionRequestNotFoundError extends DomainError {
    constructor() {
        super("SUBSCRIPTION_REQUEST_NOT_FOUND");
    }
}

export class SubscriptionRequestNotPendingError extends DomainError {
    constructor() {
        super("SUBSCRIPTION_REQUEST_NOT_PENDING");
    }
}

export class SubscriptionRequestNotReadyError extends DomainError {
    constructor() {
        super("SUBSCRIPTION_REQUEST_NOT_READY_FOR_REVIEW");
    }
}

export class SubscriptionNotFoundError extends DomainError {
    constructor() {
        super("SUBSCRIPTION_NOT_FOUND");
    }
}

export class SubscriptionAccessDeniedError extends DomainError {
    constructor() {
        super("SUBSCRIPTION_ACCESS_DENIED");
    }
}

export class PersonNotFoundError extends DomainError {
    constructor() {
        super("PERSON_NOT_FOUND");
    }
}

export class RoleNotFoundError extends DomainError {
    constructor() {
        super("ROLE_NOT_FOUND");
    }
}

export class RoleNameAlreadyExistsError extends DomainError {
    constructor() {
        super("ROLE_NAME_ALREADY_EXISTS");
    }
}

export class AdminNotFoundError extends DomainError {
    constructor() {
        super("ADMIN_NOT_FOUND");
    }
}

export class AdminDisabledError extends DomainError {
    constructor() {
        super("ADMIN_DISABLED");
    }
}

export class AdminEmailAlreadyExistsError extends DomainError {
    constructor() {
        super("ADMIN_EMAIL_ALREADY_EXISTS");
    }
}

export class FirstAdminAlreadyExistsError extends DomainError {
    constructor() {
        super("FIRST_ADMIN_ALREADY_EXISTS");
    }
}

export class AdminInviteNotFoundError extends DomainError {
    constructor() {
        super("ADMIN_INVITE_NOT_FOUND");
    }
}

export class AdminInviteExpiredError extends DomainError {
    constructor() {
        super("ADMIN_INVITE_EXPIRED");
    }
}

export class AdminInviteUsedError extends DomainError {
    constructor() {
        super("ADMIN_INVITE_USED");
    }
}

export class AdminInviteEmailMismatchError extends DomainError {
    constructor() {
        super("ADMIN_INVITE_EMAIL_MISMATCH");
    }
}

export class PasswordResetNotFoundError extends DomainError {
    constructor() {
        super("PASSWORD_RESET_NOT_FOUND");
    }
}

export class PasswordResetExpiredError extends DomainError {
    constructor() {
        super("PASSWORD_RESET_EXPIRED");
    }
}

export class PasswordResetUsedError extends DomainError {
    constructor() {
        super("PASSWORD_RESET_USED");
    }
}

export class AdminTgLinkNotFoundError extends DomainError {
    constructor() {
        super("ADMIN_TG_LINK_NOT_FOUND");
    }
}

export class AdminTgLinkExpiredError extends DomainError {
    constructor() {
        super("ADMIN_TG_LINK_EXPIRED");
    }
}

export class AdminTgLinkUsedError extends DomainError {
    constructor() {
        super("ADMIN_TG_LINK_USED");
    }
}

export class AdminTgCodePurposeMismatchError extends DomainError {
    constructor() {
        super("ADMIN_TG_CODE_PURPOSE_MISMATCH");
    }
}

export class AdminTgAlreadyLinkedError extends DomainError {
    constructor() {
        super("ADMIN_TG_ALREADY_LINKED");
    }
}

export class InvalidPermissionError extends DomainError {
    constructor() {
        super("INVALID_PERMISSION");
    }
}

export class TerminalIdentityAlreadyMappedError extends DomainError {
    constructor() {
        super("TERMINAL_IDENTITY_ALREADY_MAPPED");
    }
}

export class AlertRuleNotFoundError extends DomainError {
    constructor() {
        super("ALERT_RULE_NOT_FOUND");
    }
}

export class AlertRuleConfigInvalidError extends DomainError {
    constructor(message?: string) {
        super("ALERT_RULE_CONFIG_INVALID", message);
    }
}

export class AdminTelegramNotLinkedError extends DomainError {
    constructor() {
        super("ADMIN_TG_NOT_LINKED");
    }
}

export class RefreshTokenInvalidError extends DomainError {
    constructor() {
        super("REFRESH_TOKEN_INVALID");
    }
}

export class RefreshTokenExpiredError extends DomainError {
    constructor() {
        super("REFRESH_TOKEN_EXPIRED");
    }
}

export class RefreshTokenRevokedError extends DomainError {
    constructor() {
        super("REFRESH_TOKEN_REVOKED");
    }
}

export class RefreshTokenAlreadyUsedError extends DomainError {
    constructor() {
        super("REFRESH_TOKEN_ALREADY_USED");
    }
}

export { InvalidSettingValueError } from "./errors/settings.js";
