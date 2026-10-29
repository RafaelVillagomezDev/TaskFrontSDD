import type { ReactNode } from 'react';

import { Text } from '../ui/text.component';

interface BoardColumnProps {
  // Nombre accesible de la columna (por ejemplo, el día)
  'aria-label': string;
  children: ReactNode;
}

interface BoardColumnPartProps {
  children: ReactNode;
}

// Columna del tablero de DESIGN.md (Board Columns): 264 px fijos, que el tablero desplaza dentro de su zona
// (CONSTITUTION.md VII.5, excepción); space-6 entre la cabecera y la primera tarjeta
function BoardColumnRoot({ 'aria-label': label, children }: Readonly<BoardColumnProps>) {
  return (
    <section aria-label={label} className="flex w-column shrink-0 flex-col gap-6">
      {children}
    </section>
  );
}

// Cabecera: título y contador a la izquierda, acciones a la derecha
function BoardColumnHeader({ children }: Readonly<BoardColumnPartProps>) {
  return <header className="flex min-h-touch items-center gap-2">{children}</header>;
}

function BoardColumnTitle({ children }: Readonly<BoardColumnPartProps>) {
  return (
    <Text as="h2" variant="body" className="font-semibold">
      {children}
    </Text>
  );
}

// Lista de tarjetas con space-4 entre ellas
function BoardColumnList({ children }: Readonly<BoardColumnPartProps>) {
  return <ul className="flex flex-col gap-4">{children}</ul>;
}

export const BoardColumn = Object.assign(BoardColumnRoot, {
  Header: BoardColumnHeader,
  Title: BoardColumnTitle,
  List: BoardColumnList,
});
