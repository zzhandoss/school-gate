import { Check, Clock3, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { formatDateTime } from './subscription-requests-format'
import { SubscriptionRequestResolvePanel } from './subscription-request-resolve-panel'
import type { SubscriptionRequestItem } from '@/lib/subscription-requests/types'
import {
  subscriptionResolutionLabel,
  subscriptionStatusLabel
} from '@/lib/i18n/enum-labels'
import { PersonHoverCard } from '@/components/persons/person-hover-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type SubscriptionRequestsTableProps = {
  requests: Array<SubscriptionRequestItem>
  loading: boolean
  canReview: boolean
  hasAdminTgUserId: boolean
  reviewingRequestId: string | null
  resolvingRequestId: string | null
  onReview: (requestId: string, decision: 'approve' | 'reject') => Promise<void>
  onResolvePerson: (requestId: string, personId: string) => Promise<void>
}

function getRequestStatusBadgeClass(status: SubscriptionRequestItem['status']) {
  const classes: Record<SubscriptionRequestItem['status'], string> = {
    pending:
      'border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800/60 dark:bg-blue-900/40 dark:text-blue-200',
    approved:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-200',
    rejected:
      'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200'
  }

  return classes[status]
}

function getResolutionBadgeClass(resolutionStatus: string) {
  if (resolutionStatus === 'ready_for_review') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/40 dark:text-emerald-200'
  }
  if (resolutionStatus === 'needs_person' || resolutionStatus === 'new') {
    return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/40 dark:text-amber-200'
  }
  if (resolutionStatus === 'not_found') {
    return 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/40 dark:text-rose-200'
  }

  return 'border-border bg-muted text-foreground'
}

export function SubscriptionRequestsTable({
  requests,
  loading,
  canReview,
  hasAdminTgUserId,
  reviewingRequestId,
  resolvingRequestId,
  onReview,
  onResolvePerson
}: SubscriptionRequestsTableProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 animate-pulse rounded bg-muted/50" />
        <div className="h-10 animate-pulse rounded bg-muted/40" />
        <div className="h-10 animate-pulse rounded bg-muted/30" />
        <div className="h-10 animate-pulse rounded bg-muted/20" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
        {t('common.empty.noRequestsForFilter')}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('common.labels.iin')}</TableHead>
            <TableHead>{t('common.labels.telegram')}</TableHead>
            <TableHead>{t('common.labels.status')}</TableHead>
            <TableHead>{t('common.labels.resolution')}</TableHead>
            <TableHead className="w-[220px]">{t('common.labels.created')}</TableHead>
            <TableHead className="w-[140px] text-right">{t('common.labels.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const isPending = request.status === 'pending'
            const canReject = canReview && hasAdminTgUserId && isPending
            const canApprove =
              canReview &&
              hasAdminTgUserId &&
              isPending &&
              request.resolutionStatus === 'ready_for_review' &&
              Boolean(request.personId)
            const canResolve =
              canReview &&
              isPending &&
              (request.resolutionStatus === 'new' || request.resolutionStatus === 'needs_person')
            const isReviewing = reviewingRequestId === request.id
            const isResolving = resolvingRequestId === request.id
            const displayResolutionStatus =
              request.resolutionStatus === 'new' ? 'needs_person' : request.resolutionStatus
            const resolutionHint =
              request.resolutionStatus === 'new'
                ? t('subscriptionRequests.resolveHintNew')
                : request.resolutionMessage

            return (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.personId ? (
                    <PersonHoverCard loadDetails person={{ id: request.personId, iin: request.iin }}>
                      <button
                        type="button"
                        className="inline-flex max-w-full cursor-help truncate text-left text-foreground hover:text-primary"
                      >
                        {request.iin}
                      </button>
                    </PersonHoverCard>
                  ) : (
                    request.iin
                  )}
                </TableCell>
              <TableCell className="text-muted-foreground">{request.tgUserId}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getRequestStatusBadgeClass(request.status)}>
                  {subscriptionStatusLabel(t, request.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {resolutionHint ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={getResolutionBadgeClass(request.resolutionStatus)}
                      >
                        {subscriptionResolutionLabel(t, displayResolutionStatus)}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>{resolutionHint}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Badge
                    variant="outline"
                    className={getResolutionBadgeClass(request.resolutionStatus)}
                  >
                    {subscriptionResolutionLabel(t, displayResolutionStatus)}
                  </Badge>
                )}
              </TableCell>
                <TableCell className="w-[220px] whitespace-nowrap text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(request.createdAt)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canResolve && !isResolving && !isReviewing ? (
                      <SubscriptionRequestResolvePanel
                        request={request}
                        canResolve
                        onResolve={onResolvePerson}
                      />
                    ) : null}
                    {canReject && !isReviewing && !isResolving ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            aria-label={t('subscriptionRequests.rejectRequestAria', { requestId: request.id })}
                            onClick={() => void onReview(request.id, 'reject')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common.actions.rejectRequest')}</TooltipContent>
                      </Tooltip>
                    ) : null}
                    {canApprove && !isReviewing && !isResolving ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            aria-label={t('subscriptionRequests.approveRequestAria', { requestId: request.id })}
                            onClick={() => void onReview(request.id, 'approve')}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common.actions.approveRequest')}</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}
