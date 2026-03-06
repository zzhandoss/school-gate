import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const SUPPORTED_LANGUAGES = ['ru', 'en', 'kz'] as const

export function AppShellLanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <ToggleGroup
      type="single"
      value={i18n.resolvedLanguage}
      variant="outline"
      spacing={1}
      className="flex items-center gap-1 rounded-2xl border border-border/60 bg-background/90 p-1"
      aria-label={t('app.shell.language')}
      onValueChange={(value) => {
        if (value && SUPPORTED_LANGUAGES.includes(value as (typeof SUPPORTED_LANGUAGES)[number])) {
          void i18n.changeLanguage(value)
        }
      }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground">
        <Languages className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      {SUPPORTED_LANGUAGES.map((language) => (
        <ToggleGroupItem
          key={language}
          value={language}
          size="sm"
          className="h-8 min-w-12 rounded-xl border border-transparent px-3 text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground transition-colors duration-200 hover:text-foreground data-[state=on]:rounded-xl data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          aria-label={language.toUpperCase()}
        >
          {language.toUpperCase()}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
