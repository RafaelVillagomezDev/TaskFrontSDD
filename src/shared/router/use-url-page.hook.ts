import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';

const PAGE_PARAM = 'page';
const FIRST_PAGE = 1;

const pageParamSchema = z.coerce.number().int().positive();

export interface UrlPage {
  page: number;
  // Cambia solo la página y conserva el resto de la URL (filtros); la primera no se escribe
  goToPage: (page: number, options?: { replace?: boolean }) => void;
}

// Página de una lista paginada en la URL (?page=n), para recargar y compartir (plan D-8). Una página no válida es
// la primera
export function useUrlPage(): UrlPage {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsed = pageParamSchema.safeParse(searchParams.get(PAGE_PARAM));
  const goToPage = useCallback(
    (page: number, options?: { replace?: boolean }) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (page > FIRST_PAGE) next.set(PAGE_PARAM, String(page));
        else next.delete(PAGE_PARAM);
        return next;
      }, options);
    },
    [setSearchParams],
  );
  return { page: parsed.success ? parsed.data : FIRST_PAGE, goToPage };
}

// Una página fuera de rango (URL antigua o elementos eliminados) se sustituye por la última (plan §5.6)
export function useClampUrlPage({ page, goToPage }: UrlPage, totalPages: number | undefined): void {
  useEffect(() => {
    if (totalPages === undefined || totalPages === 0 || page <= totalPages) return;
    goToPage(totalPages, { replace: true });
  }, [page, totalPages, goToPage]);
}
