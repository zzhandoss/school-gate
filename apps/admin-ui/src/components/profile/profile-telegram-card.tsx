import { useState } from 'react'
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
        setTelegramError('Unexpected error while generating Telegram link code.')
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
      setTelegramSuccess('Telegram account unlinked successfully.')
    } catch (error) {
      if (error instanceof ApiError) {
        setTelegramError(mapAuthErrorToMessage(error.code, error.message))
      } else {
        setTelegramError('Unexpected error while unlinking Telegram account.')
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
          Telegram link
        </CardTitle>
        <CardDescription>
          Link your Telegram account to receive admin bot features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/70 bg-background/70 p-3">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Link status
          </p>
          {hasLinkedTelegram ? (
            <div className="mt-2 space-y-1">
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                Linked
              </Badge>
              <p className="text-xs text-muted-foreground">
                Telegram user id: {tgUserId}
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-1">
              <Badge variant="outline">Not linked</Badge>
              <p className="text-xs text-muted-foreground">
                Generate code and send <span className="font-mono">/link {'<code>'}</span> to bot.
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
            {isUnlinkingTelegram ? 'Unlinking...' : 'Unlink Telegram'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onGenerateTelegramCode}
            disabled={isGeneratingLinkCode}
          >
            <Mail className="h-4 w-4" />
            {isGeneratingLinkCode ? 'Generating...' : 'Generate link code'}
          </Button>
        )}

        {!hasLinkedTelegram && telegramLink ? (
          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Active code
            </p>
            <p className="mt-2 font-mono text-lg">{telegramLink.code}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Expires: {formatDateTime(telegramLink.expiresAt, telegramLink.expiresAt)}
            </p>
          </div>
        ) : null}

        {telegramSuccess ? (
          <Alert className="border-emerald-300/60 bg-emerald-50 text-emerald-900">
            <AlertTitle>Telegram updated</AlertTitle>
            <AlertDescription>{telegramSuccess}</AlertDescription>
          </Alert>
        ) : null}

        {telegramError ? (
          <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>Telegram action failed</AlertTitle>
            <AlertDescription>{telegramError}</AlertDescription>
          </Alert>
        ) : null}

        {!hasLinkedTelegram ? (
          <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">How to link</p>
            <ol className="mt-2 space-y-1">
              <li>1. Generate code above.</li>
              <li>2. Open your Telegram bot chat.</li>
              <li>3. Send command: <span className="font-mono">/link {'<code>'}</span>.</li>
            </ol>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
