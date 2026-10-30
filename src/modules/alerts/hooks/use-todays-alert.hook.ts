import { toDayKey } from '../../../shared/date/day.util';
import { useCurrentDay } from '../../../shared/date/use-current-day.hook';
import { useGetLatestAlertQuery } from '../api/alerts.api';
import type { Alert } from '../schemas/alert.schema';

// Aviso destacado en el tablero (plan §5.7, RF-37, S-05): el más reciente, solo si se generó hoy en la fecha local
// del dispositivo. Al cambiar el día deja de destacarse sin pedir nada; al volver a la pestaña se vuelve a pedir.
// Si la consulta falla no se destaca nada: el tablero sigue funcionando y la pantalla de avisos explica el error
export function useTodaysAlert(): Alert | undefined {
  const today = useCurrentDay();
  const { data } = useGetLatestAlertQuery(undefined, { refetchOnFocus: true });
  if (data === undefined || data === null) return undefined;
  return toDayKey(new Date(data.createdAt)) === today ? data : undefined;
}
