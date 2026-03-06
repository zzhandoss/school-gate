import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { applyAutoIdentities, previewAutoIdentities } from '@/lib/persons/service'
import type { ApplyAutoIdentitiesResult, AutoIdentityPreviewResult } from '@/lib/persons/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'

type PersonIdentityAutoDialogProps = {
  personId: string
  canWrite: boolean
  onApplied: () => Promise<void>
}

function matchKey(deviceId: string, terminalPersonId: string) {
  return `${deviceId}:${terminalPersonId}`
}

export function PersonIdentityAutoDialog({ personId, canWrite, onApplied }: PersonIdentityAutoDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<AutoIdentityPreviewResult | null>(null)
  const [result, setResult] = useState<ApplyAutoIdentitiesResult | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingApply, setLoadingApply] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedItems = useMemo(() => {
    if (!preview) {
      return []
    }
    return preview.matches.filter((item) => {
      const key = matchKey(item.deviceId, item.terminalPersonId)
      return selected[key]
    })
  }, [preview, selected])

  async function loadPreview() {
    setError(null)
    setResult(null)
    setLoadingPreview(true)
    try {
      const next = await previewAutoIdentities(personId)
      setPreview(next)
      const initial: Record<string, boolean> = {}
      for (const item of next.matches) {
        const key = matchKey(item.deviceId, item.terminalPersonId)
        initial[key] = !item.alreadyLinked
      }
      setSelected(initial)
    } catch (value) {
      setError(value instanceof Error ? value.message : t('persons.autoDialog.errors.previewFailed'))
    } finally {
      setLoadingPreview(false)
    }
  }

  async function applySelected() {
    if (selectedItems.length === 0) {
      setError(t('persons.autoDialog.errors.selectAtLeastOne'))
      return
    }
    setError(null)
    setLoadingApply(true)
    try {
      const applied = await applyAutoIdentities(personId, {
        identities: selectedItems.map((item) => ({
          deviceId: item.deviceId,
          terminalPersonId: item.terminalPersonId
        }))
      })
      setResult(applied)
      await onApplied()
    } catch (value) {
      setError(value instanceof Error ? value.message : t('persons.autoDialog.errors.applyFailed'))
    } finally {
      setLoadingApply(false)
    }
  }

  return (
    <>
      <Button type="button" variant="outline" disabled={!canWrite} onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4" />
        {t('persons.autoDialog.auto')}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setError(null)
            setPreview(null)
            setResult(null)
            setSelected({})
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('persons.autoDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('persons.autoDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" disabled={loadingPreview || loadingApply} onClick={() => void loadPreview()}>
              {loadingPreview ? t('persons.autoDialog.previewing') : t('persons.autoDialog.preview')}
            </Button>
            {preview ? (
              <div className="text-xs text-muted-foreground">
                {t('persons.autoDialog.diagnostics', {
                  eligible: preview.diagnostics.devicesEligible,
                  requests: preview.diagnostics.requestsSent,
                  errors: preview.diagnostics.errors
                })}
              </div>
            ) : null}
          </div>

          {error ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>{t('persons.autoDialog.operationFailedTitle')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {preview ? (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border/70 p-3">
              <div className="space-y-2">
                {preview.matches.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('common.empty.noMatches')}</p>
                ) : (
                  preview.matches.map((item) => {
                    const key = matchKey(item.deviceId, item.terminalPersonId)
                    return (
                      <div key={key} className="flex items-center justify-between rounded-md border border-border/60 p-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {item.deviceId} <span className="text-muted-foreground">({item.adapterKey})</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{t('persons.autoDialog.terminalValue', { value: item.terminalPersonId })}</p>
                          {item.displayName ? (
                            <p className="text-xs text-muted-foreground">{t('persons.autoDialog.nameValue', { value: item.displayName })}</p>
                          ) : null}
                          {item.source || item.userType ? (
                            <p className="text-xs text-muted-foreground">
                              {item.source ? t('persons.autoDialog.sourceValue', { value: item.source }) : ''}
                              {item.source && item.userType ? ', ' : ''}
                              {item.userType ? t('persons.autoDialog.userTypeValue', { value: item.userType }) : ''}
                            </p>
                          ) : null}
                          {item.score !== undefined && item.score !== null ? (
                            <p className="text-xs text-muted-foreground">{t('persons.autoDialog.scoreValue', { value: item.score })}</p>
                          ) : null}
                          {item.alreadyLinked ? <Badge variant="outline">{t('persons.autoDialog.alreadyLinked')}</Badge> : null}
                        </div>
                        <Switch
                          checked={Boolean(selected[key])}
                          disabled={loadingApply}
                          onCheckedChange={(value) => {
                            setSelected((prev) => ({ ...prev, [key]: Boolean(value) }))
                          }}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : null}

          {result ? (
            <Alert>
              <AlertTitle>{t('persons.autoDialog.applyResultTitle')}</AlertTitle>
              <AlertDescription>
                {t('persons.autoDialog.applyResultDescription', {
                  linked: result.linked,
                  alreadyLinked: result.alreadyLinked,
                  conflicts: result.conflicts,
                  errors: result.errors
                })}
              </AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={loadingApply} onClick={() => setOpen(false)}>
              {t('common.actions.close')}
            </Button>
            <Button
              type="button"
              disabled={!preview || selectedItems.length === 0 || loadingApply || loadingPreview}
              onClick={() => void applySelected()}
            >
              {loadingApply ? t('persons.autoDialog.applying') : t('persons.autoDialog.applySelected')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
