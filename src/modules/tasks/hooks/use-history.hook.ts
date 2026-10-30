import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSearchParams, type SetURLSearchParams } from 'react-router';
import { z } from 'zod';

import { errorMessage, toApiError } from '../../../shared/api/api-error.util';
import { useSingleSubmit } from '../../../shared/ui/use-single-submit.hook';
import { useGetTasksQuery } from '../api/tasks.api';
import { historyFiltersSchema, NO_HISTORY_FILTERS, type HistoryFilters } from '../schemas/history-filters.schema';
import type { Task } from '../schemas/task.schema';
import { FIRST_PAGE } from '../schemas/tasks.constants';

export type HistoryStatusView = 'loading' | 'error' | 'ready';

const NO_TASKS: Task[] = [];

const pageParamSchema = z.coerce.number().int().positive();

// Filtros de la URL (D-8): unos filtros no válidos (URL editada a mano) se ignoran en bloque
function filtersFromUrl(params: URLSearchParams): HistoryFilters {
  const parsed = historyFiltersSchema.safeParse({
    status: params.get('status') ?? NO_HISTORY_FILTERS.status,
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  });
  return parsed.success ? parsed.data : NO_HISTORY_FILTERS;
}

function pageFromUrl(params: URLSearchParams): number {
  const parsed = pageParamSchema.safeParse(params.get('page'));
  return parsed.success ? parsed.data : FIRST_PAGE;
}

// URL corta: solo los filtros que cambian algo y la página si no es la primera
function urlFor(filters: HistoryFilters, page: number): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status !== NO_HISTORY_FILTERS.status) params.set('status', filters.status);
  if (filters.from !== '') params.set('from', filters.from);
  if (filters.to !== '') params.set('to', filters.to);
  if (page > FIRST_PAGE) params.set('page', String(page));
  return params;
}

function isFiltered(filters: HistoryFilters): boolean {
  return (
    filters.status !== NO_HISTORY_FILTERS.status ||
    filters.from !== NO_HISTORY_FILTERS.from ||
    filters.to !== NO_HISTORY_FILTERS.to
  );
}

// Una página fuera de rango (URL antigua o tareas eliminadas) se sustituye por la última (plan §5.6)
function useClampPage(
  totalPages: number | undefined,
  page: number,
  filters: HistoryFilters,
  setUrl: SetURLSearchParams,
) {
  const { status, from, to } = filters;
  useEffect(() => {
    if (totalPages === undefined || totalPages === 0 || page <= totalPages) return;
    setUrl(urlFor({ status, from, to }, totalPages), { replace: true });
  }, [totalPages, page, status, from, to, setUrl]);
}

// Historial con filtros y páginas (plan §5.6, RF-31 a RF-34). Los filtros y la página viven en la URL (D-8) para
// recargar y compartir; el formulario solo los cambia cuando son válidos (RF-33)
export function useHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = filtersFromUrl(searchParams);
  const page = pageFromUrl(searchParams);
  const form = useForm<HistoryFilters>({ resolver: zodResolver(historyFiltersSchema), defaultValues: filters });

  // Al cambiar la URL (atrás, adelante, quitar filtros) el formulario muestra los filtros aplicados
  const { status: urlStatus, from: urlFrom, to: urlTo } = filters;
  useEffect(() => {
    form.reset({ status: urlStatus, from: urlFrom, to: urlTo });
  }, [form, urlStatus, urlFrom, urlTo]);

  const { currentData, error, isError, refetch } = useGetTasksQuery({ ...filters, page });
  useClampPage(currentData?.totalPages, page, filters, setSearchParams);

  let status: HistoryStatusView = 'loading';
  if (currentData !== undefined) status = 'ready';
  else if (isError) status = 'error';

  // Unos filtros nuevos empiezan en la primera página
  const onSubmit = useSingleSubmit(
    form.handleSubmit((values) => {
      setSearchParams(urlFor(values, FIRST_PAGE));
    }),
  );

  return {
    form,
    onSubmit,
    isFiltered: isFiltered(filters),
    clearFilters: () => {
      setSearchParams(urlFor(NO_HISTORY_FILTERS, FIRST_PAGE));
    },
    status,
    tasks: currentData?.items ?? NO_TASKS,
    page,
    totalPages: currentData?.totalPages ?? 0,
    totalItems: currentData?.totalItems ?? 0,
    goToPage: (next: number) => {
      setSearchParams(urlFor(filters, next));
    },
    errorMessage: status === 'error' ? errorMessage(toApiError(error).code) : undefined,
    // El resultado del reintento llega por la propia consulta
    retry: () => {
      void (async () => {
        await refetch();
      })();
    },
  };
}

export type History = ReturnType<typeof useHistory>;
