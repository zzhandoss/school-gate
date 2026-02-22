import { formatDateTime as formatI18nDateTime } from "@/lib/i18n/format";

export function formatDateTime(value: string | null) {
    return formatI18nDateTime(value, "-");
}
