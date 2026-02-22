import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { previewAutoIdentitiesByIin } from '@/lib/persons/service'
import type {
  AutoIdentityPreviewByIinResult,
  CreatePersonWithAutoIdentitiesInput,
  PersonItem,
  UpdatePersonInput
} from '@/lib/persons/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

type PersonsUpsertFormProps = {
  mode: 'create' | 'edit'
  person?: PersonItem
  canWrite: boolean
  onSubmit: (input: CreatePersonWithAutoIdentitiesInput | UpdatePersonInput) => Promise<void>
  onClose: () => void
}

function toMatchKey(deviceId: string, terminalPersonId: string) {
  return `${deviceId}:${terminalPersonId}`
}

export function PersonsUpsertForm({ mode, person, canWrite, onSubmit, onClose }: PersonsUpsertFormProps) {
  const [iin, setIin] = useState(person?.iin ?? '')
  const [firstName, setFirstName] = useState(person?.firstName ?? '')
  const [lastName, setLastName] = useState(person?.lastName ?? '')
  const [preview, setPreview] = useState<AutoIdentityPreviewByIinResult | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const trimmedIin = iin.trim()
  const isIinValid = /^\d{12}$/.test(trimmedIin)

  const canSubmit = useMemo(() => {
    if (!canWrite || isSubmitting) {
      return false
    }
    if (!isIinValid) {
      return false
    }
    return true
  }, [canWrite, isIinValid, isSubmitting])

  useEffect(() => {
    if (mode !== 'create') {
      return
    }
    if (!isIinValid) {
      setPreview(null)
      setSelected({})
      setPreviewError(null)
      setPreviewLoading(false)
      return
    }

    const currentRequestId = requestIdRef.current + 1
    requestIdRef.current = currentRequestId
    setPreviewLoading(true)
    setPreviewError(null)

    const timer = setTimeout(() => {
      void previewAutoIdentitiesByIin(trimmedIin)
        .then((result) => {
          if (requestIdRef.current !== currentRequestId) {
            return
          }
          setPreview(result)
          const nextSelected: Record<string, boolean> = {}
          for (const match of result.matches) {
            nextSelected[toMatchKey(match.deviceId, match.terminalPersonId)] = !match.alreadyLinked
          }
          setSelected(nextSelected)
          setPreviewError(null)
        })
        .catch((value) => {
          if (requestIdRef.current !== currentRequestId) {
            return
          }
          setPreview(null)
          setSelected({})
          setPreviewError(value instanceof Error ? value.message : 'Failed to load auto mappings')
        })
        .finally(() => {
          if (requestIdRef.current === currentRequestId) {
            setPreviewLoading(false)
          }
        })
    }, 400)

    return () => {
      clearTimeout(timer)
    }
  }, [isIinValid, mode, trimmedIin])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const base = {
        iin: trimmedIin,
        firstName: firstName.trim() ? firstName.trim() : null,
        lastName: lastName.trim() ? lastName.trim() : null
      }
      if (mode === 'create') {
        const selectedAutoIdentities =
          preview?.matches
            .filter((item) => selected[toMatchKey(item.deviceId, item.terminalPersonId)])
            .map((item) => ({
              deviceId: item.deviceId,
              terminalPersonId: item.terminalPersonId
            })) ?? []

        await onSubmit({
          ...base,
          ...(selectedAutoIdentities.length > 0 ? { autoIdentities: selectedAutoIdentities } : {})
        })
      } else {
        await onSubmit(base)
      }
      onClose()
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4 px-4 pb-4" onSubmit={handleSubmit}>
      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
          <AlertTitle>Cannot save person</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="person-iin">IIN</Label>
        <Input
          id="person-iin"
          value={iin}
          disabled={isSubmitting}
          onChange={(event) => setIin(event.target.value)}
          placeholder="030512550123"
        />
        {mode === 'create' ? (
          <p className="text-xs text-muted-foreground">
            {isIinValid ? 'IIN is valid.' : 'Enter exactly 12 digits.'}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="person-first-name">First name</Label>
        <Input
          id="person-first-name"
          value={firstName}
          disabled={isSubmitting}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Alihan"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="person-last-name">Last name</Label>
        <Input
          id="person-last-name"
          value={lastName}
          disabled={isSubmitting}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Erzhanov"
        />
      </div>

      {mode === 'create' ? (
        <div className="space-y-2 rounded-lg border border-border/70 p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">Auto identity suggestions</p>
            <p className="text-xs text-muted-foreground">
              Suggestions are loaded automatically when IIN is valid. Selected entries will be applied after person creation.
            </p>
          </div>

          {previewLoading ? <p className="text-xs text-muted-foreground">Searching devices...</p> : null}
          {previewError ? <p className="text-xs text-destructive">{previewError}</p> : null}

          {preview ? (
            <>
              <p className="text-xs text-muted-foreground">
                eligible {preview.diagnostics.devicesEligible}, requests {preview.diagnostics.requestsSent}, errors {preview.diagnostics.errors}
              </p>
              {preview.matches.length === 0 ? (
                <p className="text-xs text-muted-foreground">No matches found.</p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {preview.matches.map((item) => {
                    const key = toMatchKey(item.deviceId, item.terminalPersonId)
                    return (
                      <div key={key} className="flex items-center justify-between rounded-md border border-border/60 p-2">
                        <div className="space-y-1">
                          <p className="text-xs font-medium">
                            {item.deviceId} <span className="text-muted-foreground">({item.adapterKey})</span>
                          </p>
                          <p className="text-xs text-muted-foreground">terminal: {item.terminalPersonId}</p>
                          {item.displayName ? <p className="text-xs text-muted-foreground">name: {item.displayName}</p> : null}
                          {item.alreadyLinked ? <Badge variant="outline">already linked</Badge> : null}
                        </div>
                        <Switch
                          checked={Boolean(selected[key])}
                          disabled={isSubmitting || item.alreadyLinked}
                          onCheckedChange={(value) => {
                            setSelected((prev) => ({ ...prev, [key]: Boolean(value) }))
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create person' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
