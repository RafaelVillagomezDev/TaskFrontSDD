import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { COMMON_TEXTS } from '../texts/common.texts';
import { Button } from './button.component';
import { Icon } from './icon.component';
import { Text } from './text.component';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Resumen opcional, por ejemplo el total de tareas (RF-34)
  children?: ReactNode;
}

const FIRST_PAGE = 1;

export function Pagination({ page, totalPages, onPageChange, children }: PaginationProps) {
  const hasPages = totalPages > FIRST_PAGE;
  return (
    <nav aria-label={COMMON_TEXTS.pagination} className="flex flex-wrap items-center justify-between gap-3">
      <Text variant="body-sm" tone="muted">
        {COMMON_TEXTS.pageOf(page, Math.max(totalPages, FIRST_PAGE))}
        {children !== undefined && <> · {children}</>}
      </Text>
      {hasPages && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            aria-label={COMMON_TEXTS.previousPage}
            disabled={page <= FIRST_PAGE}
            onClick={() => {
              onPageChange(page - 1);
            }}
          >
            <Icon icon={ChevronLeft} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            aria-label={COMMON_TEXTS.nextPage}
            disabled={page >= totalPages}
            onClick={() => {
              onPageChange(page + 1);
            }}
          >
            <Icon icon={ChevronRight} />
          </Button>
        </div>
      )}
    </nav>
  );
}
