import { Input } from '@shared/ui/input.component';
import { Text } from '@shared/ui/text.component';
import { cn } from '@shared/utils/class-names.util';
import type { StartSessionForm } from '../hooks/use-start-session-form.hook';
import { DURATION_PRESETS } from '../schemas/pomodoro.constants';
import { CUSTOM_DURATION } from '../schemas/start-session.schema';
import { POMODORO_TEXTS } from '../texts/pomodoro.texts';

interface DurationPickerProps {
  startForm: StartSessionForm;
}

interface DurationOptionProps {
  startForm: StartSessionForm;
  value: string;
  label: string;
}

const { start: texts } = POMODORO_TEXTS;

// Opción con aspecto de botón (DESIGN.md: color solo en lo activo): radio nativo, accesible y con flechas de
// teclado de serie; el foco y la elección se pintan en la caja visible. Al menos 44 px de alto (VII.4)
function DurationOption({ startForm, value, label }: Readonly<DurationOptionProps>) {
  return (
    <label className="relative flex">
      <input {...startForm.form.register('duration')} type="radio" value={value} className="peer sr-only" />
      <span
        className={cn(
          'flex min-h-touch w-full cursor-pointer items-center justify-center rounded-md border border-border-input px-3',
          'text-body-sm font-medium text-foreground-muted anim-fast transition-colors hover:bg-surface-subtle',
          'peer-checked:border-primary peer-checked:bg-nav-active peer-checked:text-primary-text',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
        )}
      >
        {label}
      </span>
    </label>
  );
}

// Duración de la sesión (RF-06, RF-07, RF-55, RF-56): las fijas en una rejilla de 3 en móvil y en fila desde sm, y
// «Otra» con su campo de minutos, que solo aparece y se valida al elegirla
export function DurationPicker({ startForm }: Readonly<DurationPickerProps>) {
  const { errors } = startForm.form.formState;
  return (
    <fieldset className="flex flex-col gap-3">
      <Text as="legend" variant="body-sm" className="mb-2 font-medium">
        {texts.duration}
      </Text>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {DURATION_PRESETS.map((minutes) => (
          <DurationOption key={minutes} startForm={startForm} value={String(minutes)} label={texts.preset(minutes)} />
        ))}
        <DurationOption startForm={startForm} value={CUSTOM_DURATION} label={texts.custom} />
      </div>
      {startForm.isCustomDuration && (
        <Input
          {...startForm.form.register('customMinutes')}
          label={texts.customMinutes}
          inputMode="numeric"
          autoComplete="off"
          helperText={texts.customHelp}
          errorText={errors.customMinutes?.message}
        />
      )}
    </fieldset>
  );
}
