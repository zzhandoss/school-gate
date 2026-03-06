import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type PersonsSummaryCardsProps = {
  total: number
  linkedPersons: number
  unlinkedPersons: number
}

export function PersonsSummaryCards({
    total,
    linkedPersons,
    unlinkedPersons
}: PersonsSummaryCardsProps) {
    const { t } = useTranslation();

    return (
        <div className="grid gap-2 md:grid-cols-3">
            <Card className="bg-card/60">
                <CardHeader className="px-4 pb-1 pt-4">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("app.nav.persons")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                    <div className="text-2xl font-semibold">{total}</div>
                </CardContent>
            </Card>
            <Card className="bg-card/60">
                <CardHeader className="px-4 pb-1 pt-4">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("persons.linked")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                    <div className="text-2xl font-semibold">{linkedPersons}</div>
                </CardContent>
            </Card>
            <Card className="bg-card/60">
                <CardHeader className="px-4 pb-1 pt-4">
                    <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("persons.notLinked")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                    <div className="text-2xl font-semibold">{unlinkedPersons}</div>
                </CardContent>
            </Card>
        </div>
    );
}
