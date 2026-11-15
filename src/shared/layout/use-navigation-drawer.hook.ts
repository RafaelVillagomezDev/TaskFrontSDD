import { useCallback, useState } from 'react';
import { useLocation } from 'react-router';

// Drawer de navegación que se cierra al cambiar de pantalla. Estado derivado de la ruta, sin efectos:
// el drawer solo está abierto mientras la ruta es la misma en la que se abrió
export function useNavigationDrawer(): { open: boolean; onOpenChange: (open: boolean) => void } {
  const { pathname } = useLocation();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const onOpenChange = useCallback(
    (open: boolean) => {
      setOpenedAt(open ? pathname : null);
    },
    [pathname],
  );
  return { open: openedAt === pathname, onOpenChange };
}
