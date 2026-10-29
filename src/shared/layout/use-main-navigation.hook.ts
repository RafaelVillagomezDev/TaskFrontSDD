import { selectUserDisplayName } from '../../modules/auth';
import { useAppSelector } from '../store/hooks';

// Datos de la navegación: el nombre o, si no tiene, el email del usuario (RF-50)
export function useMainNavigation(): { displayName: string | null } {
  return { displayName: useAppSelector(selectUserDisplayName) };
}
