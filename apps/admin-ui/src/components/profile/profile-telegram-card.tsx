import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link2, Mail } from 'lucide-react'

import { createTelegramLinkCode, unlinkTelegram } from '@/lib/auth/service'
import { ApiError } from '@/lib/api/types'
import { mapAuthErrorToMessage } from '@/lib/auth/error-messages'
import { formatDateTime } from '@/lib/i18n/format'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type TelegramLinkState = {
  code: string
  expiresAt: string
}

type ProfileTelegramCardProps = {
  tgUserId: string | null | undefined
}

export function ProfileTelegramCard({ tgUserId }: ProfileTelegramCardProps) {
  const { t } = useTranslation()
  const [isGeneratingLinkCode, setIsGeneratingLinkCode] = useState(false)
  const [isUnlinkingTelegram, setIsUnlinkingTelegram] = useState(false)
  const [telegramLink, setTelegramLink] = useState<TelegramLinkState | null>(null)
  const [telegramError, setTelegramError] = useState<string | null>(null)
  const [telegramSuccess, setTelegramSuccess] = useState<string | null>(null)
  const hasLinkedTelegram = Boolean(tgUserId)

  async function onGenerateTelegramCode() {
    setIsGeneratingLinkCode(true)
    setTelegramError(null)
    setTelegramSuccess(null)
    try {
      const result = await createTelegramLinkCode()
      setTelegramLink({
        code: result.code,
        expiresAt: result.expiresAt
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setTelegramError(mapAuthErrorToMessage(error.code, error.message))
      } else {
        setTelegramError(t('profile.telegram.errors.generateUnexpected'))
      }
    } finally {
      setIsGeneratingLinkCode(false)
    }
  }

  async function onUnlinkTelegram() {
    setIsUnlinkingTelegram(true)
    setTelegramError(null)
    setTelegramSuccess(null)
    try {
      await unlinkTelegram()
      setTelegramLink(null)
      setTelegramSuccess(t('profile.telegram.success.unlinked'))
    } catch (error) {
      if (error instanceof ApiError) {
        setTelegramError(mapAuthErrorToMessage(error.code, error.message))
      } else {
        setTelegramError(t('profile.telegram.errors.unlinkUnexpected'))
      }
    } finally {
      setIsUnlinkingTelegram(false)
    }
  }

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          {t('profile.telegram.title')}
        </CardTitle>
        <CardDescription>
          {t('profile.telegram.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/70 bg-background/70 p-3">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {t('profile.telegram.linkStatus')}
          </p>
          {hasLinkedTelegram ? (
            <div className="mt-2 space-y-1">
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                {t('profile.telegram.linked')}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {t('profile.telegram.userId', { value: tgUserId })}
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <Badge variant="outline">{t('profile.telegram.notLinked')}</Badge>
              <p className="text-xs text-muted-foreground">
                {t('profile.telegram.notLinkedHintPrefix')}{' '}
                <span className="font-mono">/link {'<code>'}</span>{' '}
                {t('profile.telegram.notLinkedHintSuffix')}
              </p>
            </div>
          )}
        </div>

        {hasLinkedTelegram ? (
          <Button
            type="button"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onUnlinkTelegram}
            disabled={isUnlinkingTelegram}
          >
            <Link2 className="h-4 w-4" />
            {isUnlinkingTelegram ? t('profile.telegram.unlinking') : t('profile.telegram.unlink')}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onGenerateTelegramCode}
            disabled={isGeneratingLinkCode}
          >
            <Mail className="h-4 w-4" />
            {isGeneratingLinkCode ? t('profile.telegram.generating') : t('profile.telegram.generate')}
          </Button>
        )}

        {!hasLinkedTelegram && telegramLink ? (
          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {t('profile.telegram.activeCode')}
            </p>
            <p className="mt-2 font-mono text-lg">{telegramLink.code}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('profile.telegram.expires', {
                value: formatDateTime(telegramLink.expiresAt, telegramLink.expiresAt)
              })}
            </p>
          </div>
        ) : null}

        {telegramSuccess ? (
          <Alert className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
            <AlertTitle>{t('profile.telegram.updatedTitle')}</AlertTitle>
            <AlertDescription>{telegramSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {telegramError ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>{t('profile.telegram.actionFailedTitle')}</AlertTitle>
            <AlertDescription>{telegramError}</AlertDescription>
          </Alert>
        ) : null}

        {!hasLinkedTelegram ? (
          <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{t('profile.telegram.howToLink')}</p>
            <ol className="mt-2 space-y-1">
              <li>{t('profile.telegram.steps.generate')}</li>
              <li>{t('profile.telegram.steps.openChat')}</li>
              <li>
                {t('profile.telegram.steps.sendPrefix')}{' '}
                <span className="font-mono">/link {'<code>'}</span>
                {t('profile.telegram.steps.sendSuffix')}
              </li>
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
