// Textos comunes a todas las pantallas (AGENTS.md §4: nunca escritos directamente en el JSX)
export const COMMON_TEXTS = {
  loading: 'Cargando…',
  retry: 'Reintentar',
  cancel: 'Cancelar',
  close: 'Cerrar',
  save: 'Guardar',
  delete: 'Eliminar',
  showPassword: 'Mostrar contraseña',
  hidePassword: 'Ocultar contraseña',
  pagination: 'Paginación',
  previousPage: 'Página anterior',
  nextPage: 'Página siguiente',
  pageOf: (page: number, totalPages: number): string => `Página ${String(page)} de ${String(totalPages)}`,
};
