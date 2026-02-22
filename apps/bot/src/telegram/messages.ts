import type { AdminAccessView } from "../application/adminBotService.js";
import type { ParentDashboardView } from "../application/parentBotService.js";

function formatName(input: { firstName: string | null; lastName: string | null; iin: string }): string {
    const fullName = [input.firstName, input.lastName]
        .filter((part) => Boolean(part && part.trim().length > 0))
        .join(" ");

    if (fullName.length > 0) {
        return `${fullName} (${input.iin})`;
    }

    return input.iin;
}

function formatRequestStatus(input: ParentDashboardView["requests"][number]): string {
    if (input.status === "approved") return "Одобрена";
    if (input.status === "rejected") return "Отклонена";

    if (input.resolutionStatus === "ready_for_review") return "На проверке у администратора";
    if (input.resolutionStatus === "needs_person") return "Нужны уточнения";
    return "Новая";
}

export function formatDashboardMessage(view: ParentDashboardView): string {
    const parts: string[] = [];

    parts.push("📄 Ваши подписки:");
    if (view.subscriptions.length === 0) {
        parts.push("• Пока нет подписок.");
    } else {
        for (const item of view.subscriptions) {
            const state = item.isActive ? "активна" : "отключена";
            parts.push(`• ${formatName(item.person)} — ${state}`);
        }
    }

    parts.push("");
    parts.push("📝 Ваши заявки:");
    if (view.requests.length === 0) {
        parts.push("• Заявок пока нет.");
    } else {
        for (const request of view.requests) {
            const status = formatRequestStatus(request);
            const extra = request.resolutionMessage ? ` (${request.resolutionMessage})` : "";
            parts.push(`• ${request.iin} — ${status}${extra}`);
        }
    }

    return parts.join("\n");
}

export function formatAdminMenuMessage(admin: AdminAccessView): string {
    const displayName = admin.name && admin.name.trim().length > 0 ? admin.name : admin.email;

    return [
        "🛡 Админ-режим активен.",
        `Профиль: ${displayName}`,
        "Пока здесь только заглушка. Следующим шагом добавим админ-кнопки и сценарии."
    ].join("\n");
}

export function helpText(): string {
    return [
        "ℹ️ Как пользоваться ботом:",
        "• Родитель: нажмите «Новая заявка» и отправьте ИИН ученика (12 цифр).",
        "• Родитель: в «Мои подписки» можно посмотреть заявки и включать/отключать подписки.",
        "• Админ: выполните /link <код> для привязки Telegram к аккаунту.",
        "• Если у вас есть обе роли, переключайтесь кнопками «Режим родителя/админа»."
    ].join("\n");
}
