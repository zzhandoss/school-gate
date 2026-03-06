import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getPersonTerminalUserPhoto } from '@/lib/persons/service'
import type { DeviceItem } from '@/lib/devices/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type PersonTerminalPhotoPreviewDialogProps = {
  personId: string
  device: DeviceItem
  userId: string
  triggerLabel: string
  previewTitle: string
  previewAlt: string
  loadingLabel: string
}

function resolveImageSource(input: { photoData?: Array<string> | null, photoUrl?: Array<string> | null }) {
  const base64 = input.photoData?.[0]?.trim()
  if (base64) {
    return `data:image/jpeg;base64,${base64}`
  }
  const url = input.photoUrl?.[0]?.trim()
  return url && url.length > 0 ? url : null
}

export function PersonTerminalPhotoPreviewDialog({
  personId,
  device,
  userId,
  triggerLabel,
  previewTitle,
  previewAlt,
  loadingLabel
}: PersonTerminalPhotoPreviewDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  async function openDialog() {
    setOpen(true)
    setLoading(true)
    setError(null)
    setImageSrc(null)

    try {
      const response = await getPersonTerminalUserPhoto(personId, {
        deviceId: device.deviceId,
        userId
      })
      const nextImageSrc = resolveImageSource(response.photo)
      if (!nextImageSrc) {
        throw new Error('Terminal did not return a previewable face photo')
      }
      setImageSrc(nextImageSrc)
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Failed to load terminal photo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="h-auto px-0 text-xs underline-offset-4 hover:underline" onClick={() => void openDialog()}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>{device.name} ({device.deviceId})</DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="rounded-md border border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
              {loadingLabel}
            </div>
          ) : null}

          {error ? (
            <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
              <AlertTitle>{t('persons.mutationFailedTitle')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {!loading && !error && imageSrc ? (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background/60">
              <img src={imageSrc} alt={previewAlt} className="max-h-[70vh] w-full object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
