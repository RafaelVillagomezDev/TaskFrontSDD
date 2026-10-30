import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '../../../shared/ui/badge.component';
import { Box } from '../../../shared/ui/box.component';
import { Button } from '../../../shared/ui/button.component';
import { Checkbox } from '../../../shared/ui/checkbox.component';
import { Icon } from '../../../shared/ui/icon.component';
import { Text } from '../../../shared/ui/text.component';
import { cn } from '../../../shared/utils/class-names.util';
import type { Task } from '../schemas/task.schema';
import { TASKS_TEXTS } from '../texts/tasks.texts';

// board: tarjeta de columna, con título y descripción de 2 líneas como mucho (DESIGN.md Task Card); list: en el
// historial, donde no hay otra forma de leerlos, completos
export type TaskCardVariant = 'board' | 'list';

interface TaskCardProps {
  task: Task;
  variant?: TaskCardVariant | undefined;
  // Datos extra antes del estado, por ejemplo la fecha en el historial (RF-31)
  children?: ReactNode;
  // Con onToggleCompleted la tarea se puede completar y desmarcar: solo las de hoy (RF-13, RF-20 a RF-22)
  onToggleCompleted?: (() => void) | undefined;
  // Mientras se guarda el cambio, la casilla no admite otro
  isUpdating?: boolean | undefined;
  // La casilla toma el foco al montarse: la tarea acaba de cambiar de lista al completarla o desmarcarla
  keepFocus?: boolean | undefined;
  // Con onEdit la tarea se puede editar: hoy y días futuros (RF-13, RF-29)
  onEdit?: (() => void) | undefined;
  // Con onDelete la tarea se puede eliminar: hoy y días futuros (RF-13, RF-23)
  onDelete?: (() => void) | undefined;
}

// Ref de callback estable: React la llama al montar la casilla (y con null al desmontarla)
function focusOnMount(element: HTMLInputElement | null): void {
  element?.focus();
}

interface TaskTitleProps {
  task: Task;
  as: 'p' | 'span';
  variant: TaskCardVariant;
}

// Título que parte las palabras largas para no desbordar (RNF-03). En el tablero, de 2 líneas como mucho y con el
// texto completo al pasar el ratón. dir="auto": un título en árabe o hebreo se alinea en su sentido
function TaskTitle({ task, as, variant }: Readonly<TaskTitleProps>) {
  const isClamped = variant === 'board';
  return (
    <Text
      as={as}
      variant="body-sm"
      dir="auto"
      title={isClamped ? task.title : undefined}
      className={cn(
        'font-medium break-words',
        isClamped && 'line-clamp-2',
        task.completed && 'text-foreground-muted line-through',
      )}
    >
      {task.title}
    </Text>
  );
}

// Tarjeta de DESIGN.md (Task Card): superficie con borde, radius-md, space-4 y sin sombra en reposo.
// Si se puede completar, el título es la etiqueta de la casilla: toda la línea es pulsable y la casilla se llama
// como la tarea; la casilla mide 44×44 px en móvil (VII.4)
export function TaskCard({
  task,
  variant = 'board',
  children,
  onToggleCompleted,
  isUpdating = false,
  keepFocus = false,
  onEdit,
  onDelete,
}: Readonly<TaskCardProps>) {
  return (
    <Box as="li" className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      {onToggleCompleted === undefined ? (
        <TaskTitle task={task} as="p" variant={variant} />
      ) : (
        <label className="flex cursor-pointer items-center gap-2">
          {/* aria-disabled y no disabled: un control deshabilitado pierde el foco a mitad de uso con teclado */}
          <Checkbox
            ref={keepFocus ? focusOnMount : undefined}
            checked={task.completed}
            aria-disabled={isUpdating}
            onChange={onToggleCompleted}
          />
          <TaskTitle task={task} as="span" variant={variant} />
        </label>
      )}
      {task.description !== null && (
        <Text
          variant="caption"
          tone="muted"
          dir="auto"
          className={cn('break-words whitespace-pre-line', variant === 'board' && 'line-clamp-2')}
        >
          {task.description}
        </Text>
      )}
      {/* Estado con las variantes de DESIGN.md (Status → Badge Mapping) */}
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {task.completed ? (
          <Badge variant="success">{TASKS_TEXTS.status.completed}</Badge>
        ) : (
          <Badge>{TASKS_TEXTS.status.pending}</Badge>
        )}
        <div className="ml-auto flex items-center">
          {onEdit !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={TASKS_TEXTS.edit.action(task.title)}
              className="text-foreground-muted"
              onClick={onEdit}
            >
              <Icon icon={Pencil} />
            </Button>
          )}
          {onDelete !== undefined && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={TASKS_TEXTS.delete.action(task.title)}
              className="text-foreground-muted"
              onClick={onDelete}
            >
              <Icon icon={Trash2} />
            </Button>
          )}
        </div>
      </div>
    </Box>
  );
}
