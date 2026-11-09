import { Plus, X } from 'lucide-react';

import { Button } from '@shared/ui/button.component';
import { DateInput } from '@shared/ui/date-input.component';
import { Icon } from '@shared/ui/icon.component';
import { Input } from '@shared/ui/input.component';
import { Text } from '@shared/ui/text.component';
import { Textarea } from '@shared/ui/textarea.component';
import type { NewTaskRows } from '../hooks/use-new-task-rows.hook';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface NewTaskFieldsProps {
  rows: NewTaskRows;
}

const { newTask: texts } = POMODORO_TEXTS;

// Filas de tareas nuevas, compartidas por empezar una sesión y añadir tareas (RF-08 a RF-13). Cada fila es un
// fieldset con su número como legend, sus campos con el error debajo y «Quitar» en la esquina. «Añadir tarea»
// deja de ofrecerse con 20 (RF-13)
export function NewTaskFields({ rows }: Readonly<NewTaskFieldsProps>) {
  return (
    <div className="flex flex-col gap-4">
      {rows.rows.map((key, index) => (
        <div key={key} className="relative rounded-md border border-border p-4">
          <fieldset className="flex flex-col gap-4">
            <Text as="legend" variant="body-sm" className="mb-4 font-semibold">
              {texts.legend(index + 1)}
            </Text>
            <Input
              {...rows.register(index, 'title')}
              label={texts.title}
              autoComplete="off"
              errorText={rows.errorOf(index, 'title')}
            />
            <Textarea
              {...rows.register(index, 'description')}
              label={texts.description}
              errorText={rows.errorOf(index, 'description')}
            />
            <DateInput
              {...rows.register(index, 'date')}
              label={texts.date}
              min={rows.minDate}
              errorText={rows.errorOf(index, 'date')}
            />
          </fieldset>
          <div className="absolute top-1 right-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={texts.remove(index + 1)}
              onClick={() => {
                rows.remove(index);
              }}
            >
              <Icon icon={X} />
            </Button>
          </div>
        </div>
      ))}
      {rows.listError !== undefined && (
        <Text variant="body-sm" tone="danger">
          {rows.listError}
        </Text>
      )}
      {rows.canAdd ? (
        <Button variant="secondary" onClick={rows.add} className="self-start">
          <Icon icon={Plus} />
          {texts.add}
        </Button>
      ) : (
        <Text variant="body-sm" tone="muted">
          {texts.limitReached}
        </Text>
      )}
    </div>
  );
}
