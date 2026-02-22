import {
    AdminDisabledError,
    AdminEmailAlreadyExistsError,
    AdminInviteEmailMismatchError,
    AdminInviteExpiredError,
    AdminInviteNotFoundError,
    AdminInviteUsedError,
    AdminNotFoundError,
    FirstAdminAlreadyExistsError,
    AdminTelegramNotLinkedError,
    AdminTgAlreadyLinkedError,
    AdminTgCodePurposeMismatchError,
    AdminTgLinkExpiredError,
    AdminTgLinkNotFoundError,
    AdminTgLinkUsedError,
    AlertRuleConfigInvalidError,
    AlertRuleNotFoundError,
    InvalidIinError,
    InvalidPermissionError,
    PasswordResetExpiredError,
    PasswordResetNotFoundError,
    PasswordResetUsedError,
    PersonNotFoundError,
    RefreshTokenAlreadyUsedError,
    RefreshTokenExpiredError,
    RefreshTokenInvalidError,
    RefreshTokenRevokedError,
    RoleNameAlreadyExistsError,
    RoleNotFoundError,
    SubscriptionRequestNotFoundError,
    SubscriptionRequestNotPendingError,
    SubscriptionRequestNotReadyError,
    TerminalIdentityAlreadyMappedError
} from "@school-gate/core";
import type { RouteErrorMapping } from "../../context.js";
import { InvalidCredentialsError } from "../../../../composition/errors/invalidCredentials.error.js";
import { CurrentPasswordInvalidError } from "../../../../composition/errors/currentPasswordInvalid.error.js";
import { RetentionOperationError } from "../../../../composition/errors/retentionOperation.error.js";
import { SubscriptionNotFoundError } from "../../../../composition/errors/subscriptionNotFound.error.js";
import { TelegramDeliveryUnavailableError } from "../../../../composition/errors/telegramDeliveryUnavailable.error.js";
import { UnexpectedIngestStatusError } from "../../../../composition/errors/unexpectedIngestStatus.error.js";

export const domainErrorRegistry: readonly RouteErrorMapping[] = [
    { error: InvalidCredentialsError, response: { status: 401, code: "invalid_credentials", message: "Invalid email or password" } },
    { error: CurrentPasswordInvalidError, response: { status: 401, code: "current_password_invalid", message: "Current password is invalid" } },
    { error: SubscriptionNotFoundError, response: { status: 404, code: "subscription_not_found", message: "Subscription not found" } },
    { error: AdminDisabledError, response: { status: 403, code: "admin_disabled", message: "Admin is disabled" } },
    { error: RoleNotFoundError, response: { status: 404, code: "role_not_found", message: "Role was not found" } },
    { error: RoleNameAlreadyExistsError, response: { status: 409, code: "role_name_exists", message: "Role name already exists" } },
    { error: InvalidPermissionError, response: { status: 400, code: "invalid_permission", message: "Invalid permission" } },
    { error: AdminInviteNotFoundError, response: { status: 404, code: "admin_invite_not_found", message: "Invite was not found" } },
    { error: AdminInviteExpiredError, response: { status: 410, code: "admin_invite_expired", message: "Invite is expired" } },
    { error: AdminInviteUsedError, response: { status: 409, code: "admin_invite_used", message: "Invite is already used" } },
    { error: AdminInviteEmailMismatchError, response: { status: 409, code: "admin_invite_email_mismatch", message: "Invite email does not match" } },
    { error: FirstAdminAlreadyExistsError, response: { status: 409, code: "first_admin_already_exists", message: "First admin already exists" } },
    { error: AdminEmailAlreadyExistsError, response: { status: 409, code: "admin_email_exists", message: "Admin email already exists" } },
    { error: PasswordResetNotFoundError, response: { status: 404, code: "password_reset_not_found", message: "Reset was not found" } },
    { error: PasswordResetExpiredError, response: { status: 410, code: "password_reset_expired", message: "Reset is expired" } },
    { error: PasswordResetUsedError, response: { status: 409, code: "password_reset_used", message: "Reset is already used" } },
    { error: RefreshTokenInvalidError, response: { status: 401, code: "refresh_token_invalid", message: "Refresh token is invalid" } },
    { error: RefreshTokenExpiredError, response: { status: 401, code: "refresh_token_expired", message: "Refresh token is expired" } },
    { error: RefreshTokenRevokedError, response: { status: 401, code: "refresh_token_revoked", message: "Refresh token is revoked" } },
    { error: RefreshTokenAlreadyUsedError, response: { status: 401, code: "refresh_token_used", message: "Refresh token is already used" } },
    { error: AdminNotFoundError, response: { status: 404, code: "admin_not_found", message: "Admin was not found" } },
    { error: AdminTgLinkNotFoundError, response: { status: 404, code: "admin_tg_link_not_found", message: "Link code not found" } },
    { error: AdminTgLinkExpiredError, response: { status: 410, code: "admin_tg_link_expired", message: "Link code expired" } },
    { error: AdminTgLinkUsedError, response: { status: 409, code: "admin_tg_link_used", message: "Link code already used" } },
    { error: AdminTgCodePurposeMismatchError, response: { status: 409, code: "admin_tg_code_purpose_mismatch", message: "Telegram code purpose mismatch" } },
    { error: AdminTgAlreadyLinkedError, response: { status: 409, code: "admin_tg_already_linked", message: "Telegram already linked" } },
    { error: SubscriptionRequestNotFoundError, response: { status: 404, code: "subscription_request_not_found", message: "Subscription request was not found" } },
    { error: SubscriptionRequestNotPendingError, response: { status: 409, code: "subscription_request_not_pending", message: "Subscription request is not pending" } },
    { error: SubscriptionRequestNotReadyError, response: { status: 409, code: "subscription_request_not_ready", message: "Subscription request is not ready for approval" } },
    { error: InvalidIinError, response: { status: 400, code: "iin_invalid", message: "IIN format is invalid" } },
    { error: TerminalIdentityAlreadyMappedError, response: { status: 409, code: "terminal_identity_conflict", message: "Terminal identity is already mapped to another person" } },
    { error: PersonNotFoundError, response: { status: 404, code: "person_not_found", message: "Person was not found" } },
    { error: AlertRuleNotFoundError, response: { status: 404, code: "alert_rule_not_found", message: "Alert rule not found" } },
    { error: AlertRuleConfigInvalidError, response: (error) => ({ status: 400, code: "alert_rule_config_invalid", message: (error as Error).message }) },
    { error: AdminTelegramNotLinkedError, response: { status: 409, code: "admin_tg_not_linked", message: "Admin Telegram is not linked" } },
    { error: TelegramDeliveryUnavailableError, response: { status: 502, code: "telegram_delivery_unavailable", message: "Telegram delivery is unavailable" } },
    {
        error: RetentionOperationError,
        response: (error) => {
            const typedError = error as RetentionOperationError;
            if (typedError.operation === "apply_schedule") {
                return {
                    status: 500,
                    code: "retention_schedule_failed",
                    message: "Failed to apply retention schedule",
                    data: { reason: typedError.reason }
                };
            }
            if (typedError.operation === "remove_schedule") {
                return {
                    status: 500,
                    code: "retention_schedule_remove_failed",
                    message: "Failed to remove retention schedule",
                    data: { reason: typedError.reason }
                };
            }

            return {
                status: 500,
                code: "retention_run_once_failed",
                message: "Failed to run retention cleanup",
                data: { reason: typedError.reason }
            };
        }
    },
    {
        error: UnexpectedIngestStatusError,
        response: {
            status: 500,
            code: "internal_error",
            message: "Unexpected ingest processing status"
        }
    }
];
