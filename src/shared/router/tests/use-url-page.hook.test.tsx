import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { useRouterProbe } from '../../../../jest/render-app';
import { useClampUrlPage, useUrlPage } from '../use-url-page.hook';

function setup(url: string, totalPages?: number) {
  return renderHook(
    ({ total }) => {
      const urlPage = useUrlPage();
      useClampUrlPage(urlPage, total);
      return { urlPage, router: useRouterProbe() };
    },
    {
      initialProps: { total: totalPages },
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
      ),
    },
  );
}

describe('useUrlPage', () => {
  it.each([
    ['/x?page=3', 3],
    ['/x', 1],
    ['/x?page=0', 1],
    ['/x?page=abc', 1],
    ['/x?page=1.5', 1],
  ])('D-8: en %s la página es %i', (url, page) => {
    const { result } = setup(url);
    expect(result.current.urlPage.page).toBe(page);
  });

  it('D-8: cambiar de página conserva el resto de la URL y la primera no se escribe', () => {
    const { result } = setup('/x?status=pending');
    act(() => {
      result.current.urlPage.goToPage(2);
    });
    expect(result.current.router.location.search).toBe('?status=pending&page=2');
    act(() => {
      result.current.urlPage.goToPage(1);
    });
    expect(result.current.router.location.search).toBe('?status=pending');
  });

  it('plan §5.6: con la página fuera de rango la sustituye por la última; sin páginas o sin datos, no', () => {
    const { result, rerender } = setup('/x?page=9');
    expect(result.current.urlPage.page).toBe(9);
    rerender({ total: 0 });
    expect(result.current.urlPage.page).toBe(9);
    rerender({ total: 4 });
    expect(result.current.urlPage.page).toBe(4);
    expect(result.current.router.navigationType).toBe('REPLACE');
  });
});
