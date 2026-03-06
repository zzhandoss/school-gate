import { useTranslation } from "react-i18next";

export function PersonsPageHeader() {
    const { t } = useTranslation();

    return (
        <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">{t("app.nav.persons")}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
                {t("persons.subtitle")}
            </p>
        </div>
    );
}
