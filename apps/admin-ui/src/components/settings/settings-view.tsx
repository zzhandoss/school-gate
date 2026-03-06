import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { SettingsSectionCard } from './settings-section-card'
import { GROUP_DEFS, buildPatchForGroup, createGroupDraft, isGroupChanged, validateGroup } from './settings-utils'
import type { GroupDraft, GroupKey, GroupSnapshot, SectionState } from './settings-utils'
import { ApiError } from '@/lib/api/types'
import { useSession } from '@/lib/auth/session-store'
import { getRuntimeSettingsSnapshot, patchRuntimeSettings } from '@/lib/settings/service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const EMPTY_STATE: SectionState = {
  saving: false,
  success: null,
  error: null
}
const INITIAL_GROUP = GROUP_DEFS[0]?.key ?? 'worker'

function createInitialSectionStates() {
  return GROUP_DEFS.reduce((accumulator, group) => {
    accumulator[group.key] = { ...EMPTY_STATE }
    return accumulator
  }, {} as Record<GroupKey, SectionState>)
}

export function SettingsView() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const isMountedRef = useRef(true)
  const session = useSession()
  const permissions = session?.admin.permissions ?? []
  const canRead = permissions.includes('settings.read')
  const canWrite = permissions.includes('settings.write')
  const [activeGroup, setActiveGroup] = useState<GroupKey>(INITIAL_GROUP)
  const [loadingGroup, setLoadingGroup] = useState(false)
  const [loadedGroups, setLoadedGroups] = useState<Partial<Record<GroupKey, boolean>>>({})
  const [groupErrors, setGroupErrors] = useState<Partial<Record<GroupKey, string | null>>>({})
  const [snapshots, setSnapshots] = useState<Partial<Record<GroupKey, GroupSnapshot>>>({})
  const [drafts, setDrafts] = useState<Partial<Record<GroupKey, GroupDraft>>>({})
  const [sectionStates, setSectionStates] = useState<Record<GroupKey, SectionState>>(() => createInitialSectionStates())

  const loadGroup = useCallback(async (groupKey: GroupKey, options?: { force?: boolean }) => {
    const shouldForce = options?.force ?? false
    if (!shouldForce && loadedGroups[groupKey]) {
      return
    }
    setLoadingGroup(true)
    setGroupErrors((current) => ({ ...current, [groupKey]: null }))
    try {
      const next = await getRuntimeSettingsSnapshot()
      if (!isMountedRef.current) {
        return
      }
      const group = GROUP_DEFS.find((item) => item.key === groupKey)
      if (!group) {
        return
      }
      const groupSnapshot = next[groupKey] as GroupSnapshot
      setSnapshots((current) => ({ ...current, [groupKey]: groupSnapshot }))
      setDrafts((current) => ({ ...current, [groupKey]: createGroupDraft(group, groupSnapshot) }))
      setLoadedGroups((current) => ({ ...current, [groupKey]: true }))
      setSectionStates((current) => ({
        ...current,
        [groupKey]: { ...EMPTY_STATE }
      }))
    } catch (value) {
      if (!isMountedRef.current) {
        return
      }
      if (value instanceof ApiError && value.code === 'server_unreachable') {
        await router.navigate({ to: '/unavailable' })
        return
      }
      setGroupErrors((current) => ({
        ...current,
        [groupKey]: value instanceof Error ? value.message : t('settings.loadFailed')
      }))
    } finally {
      if (isMountedRef.current) {
        setLoadingGroup(false)
      }
    }
  }, [loadedGroups, router, t])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!canRead) {
      return
    }
    void loadGroup(activeGroup)
  }, [activeGroup, canRead, loadGroup])

  function onDraftChange(groupKey: GroupKey, fieldKey: string, value: string | boolean) {
    setDrafts((current) => {
      const currentGroup = current[groupKey]
      if (!currentGroup) {
        return current
      }
      return {
        ...current,
        [groupKey]: {
          ...currentGroup,
          [fieldKey]: value
        }
      }
    })
    setSectionStates((current) => ({
      ...current,
      [groupKey]: {
        ...current[groupKey],
        success: null,
        error: null
      }
    }))
  }

  function onResetGroup(groupKey: GroupKey) {
    const group = GROUP_DEFS.find((item) => item.key === groupKey)
    const groupSnapshot = snapshots[groupKey]
    if (!group || !groupSnapshot) {
      return
    }
    const source = createGroupDraft(group, groupSnapshot)
    setDrafts((current) => ({ ...current, [groupKey]: source }))
    setSectionStates((current) => ({
      ...current,
      [groupKey]: { ...EMPTY_STATE }
    }))
  }

  async function onSaveGroup(groupKey: GroupKey) {
    if (!canWrite) {
      return
    }
    const group = GROUP_DEFS.find((item) => item.key === groupKey)
    const groupSnapshot = snapshots[groupKey]
    const groupDraft = drafts[groupKey]
    if (!group || !groupSnapshot || !groupDraft) {
      return
    }

    const validationError = validateGroup(group, groupDraft)
    if (validationError) {
      const fieldDefinition = group.fields.find((field) => field.key === validationError.fieldKey)
      const fieldLabel = t(`settings.groups.${group.key}.fields.${validationError.fieldKey}.label`, {
        defaultValue: fieldDefinition?.label ?? validationError.fieldKey
      })
      setSectionStates((current) => ({
        ...current,
        [groupKey]: {
          saving: false,
          success: null,
          error: t(validationError.key, { field: fieldLabel })
        }
      }))
      return
    }

    const patch = buildPatchForGroup(group, groupSnapshot, groupDraft)
    if (!patch) {
      return
    }

    setSectionStates((current) => ({
      ...current,
      [groupKey]: { saving: true, success: null, error: null }
    }))

    try {
      await patchRuntimeSettings(patch)
      await loadGroup(groupKey, { force: true })
      setSectionStates((current) => ({
        ...current,
        [groupKey]: { saving: false, success: t('settings.sectionUpdated'), error: null }
      }))
    } catch (value) {
      setSectionStates((current) => ({
        ...current,
        [groupKey]: {
          saving: false,
          success: null,
          error: value instanceof Error ? value.message : t('settings.saveFailed')
        }
      }))
    }
  }

  function getChanged(groupKey: GroupKey) {
    const group = GROUP_DEFS.find((item) => item.key === groupKey)
    const groupSnapshot = snapshots[groupKey]
    const groupDraft = drafts[groupKey]
    if (!group || !groupSnapshot || !groupDraft) {
      return false
    }
    return isGroupChanged(group, groupSnapshot, groupDraft)
  }

  const activeSnapshot = snapshots[activeGroup]
  const activeError = groupErrors[activeGroup] ?? null

  if (!canRead) {
    return (
      <Alert className="border-amber-300/60 bg-amber-50 text-amber-900">
        <AlertTitle>{t('settings.accessDeniedTitle')}</AlertTitle>
        <AlertDescription>
          {t('settings.accessDeniedDescription')}
        </AlertDescription>
      </Alert>
    )
  }

  if (loadingGroup && !activeSnapshot) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (activeError) {
    return (
      <Alert className="border-destructive/40 bg-destructive/5 text-destructive">
        <AlertTitle>{t('settings.loadFailedTitle')}</AlertTitle>
        <AlertDescription>{activeError}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t('settings.runtimeTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('settings.runtimeDescription')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={canWrite ? 'default' : 'outline'}>
            {canWrite ? t('settings.writable') : t('settings.readOnly')}
          </Badge>
          <Button type="button" variant="outline" onClick={() => void loadGroup(activeGroup, { force: true })}>
            {t('settings.refreshTab')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="mb-2">
          <h2 className="text-sm font-semibold">{t('app.language.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('app.language.description')}</p>
        </div>
        <div className="max-w-[260px]">
          <Select value={i18n.resolvedLanguage === 'kz' ? 'kz' : i18n.resolvedLanguage === 'ru' ? 'ru' : 'en'} onValueChange={(value) => { void i18n.changeLanguage(value) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ru">{t('app.language.ru')}</SelectItem>
              <SelectItem value="en">{t('app.language.en')}</SelectItem>
              <SelectItem value="kz">{t('app.language.kz')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeGroup} onValueChange={(value) => setActiveGroup(value as GroupKey)} className="gap-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-muted/70 p-1">
          {GROUP_DEFS.map((group) => (
            <TabsTrigger key={group.key} value={group.key} className="cursor-pointer px-3 py-2 capitalize">
              {t(`settings.groups.${group.key}.title`, { defaultValue: group.title })}
            </TabsTrigger>
          ))}
        </TabsList>

        {GROUP_DEFS.map((group) => (
          <TabsContent key={group.key} value={group.key} className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5">
            {!loadedGroups[group.key] || !snapshots[group.key] || !drafts[group.key] ? (
              <Skeleton className="h-80" />
            ) : (
              <SettingsSectionCard
                group={group}
                groupSnapshot={snapshots[group.key] as GroupSnapshot}
                draft={drafts[group.key] as GroupDraft}
                changed={getChanged(group.key)}
                canWrite={canWrite}
                sectionState={sectionStates[group.key]}
                onDraftChange={(fieldKey, value) => onDraftChange(group.key, fieldKey, value)}
                onReset={() => onResetGroup(group.key)}
                onSave={() => onSaveGroup(group.key)}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
