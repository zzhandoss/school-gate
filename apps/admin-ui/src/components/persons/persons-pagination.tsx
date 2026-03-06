import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1]
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)
  pages.add(currentPage)
  pages.add(currentPage - 1)
  pages.add(currentPage + 1)

  const sorted = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)

  const items: Array<number | 'ellipsis'> = []
  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index]
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push('ellipsis')
    }
    items.push(page)
  }

  return items
}

type PersonsPaginationProps = {
  rangeStart: number
  rangeEnd: number
  total: number
  currentPage: number
  totalPages: number
  loading: boolean
  onGoToPage: (page: number) => void
}

export function PersonsPagination({
  rangeStart,
  rangeEnd,
  total,
  currentPage,
  totalPages,
  loading,
  onGoToPage
}: PersonsPaginationProps) {
  const { t } = useTranslation()
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  )
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-4">
      <p className="text-sm text-muted-foreground">
        {t('persons.range', { from: rangeStart, to: rangeEnd, total })}
      </p>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={!canGoPrev || loading}
              onClick={() => onGoToPage(currentPage - 1)}
            />
          </PaginationItem>
          {paginationItems.map((item, index) => (
            <PaginationItem key={`${String(item)}-${index}`}>
              {item === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  isActive={item === currentPage}
                  onClick={(event) => {
                    event.preventDefault()
                    onGoToPage(item)
                  }}
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              disabled={!canGoNext || loading}
              onClick={() => onGoToPage(currentPage + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
