// Une clases de Tailwind descartando las condicionales que no aplican
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
