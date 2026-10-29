import type { ComponentPropsWithRef } from 'react';

import { cn } from '../utils/class-names.util';
import { controlClassName, Field } from './field.component';
import { useFieldIds } from './use-field-ids.hook';

export interface InputProps extends ComponentPropsWithRef<'input'> {
  label: string;
  helperText?: string | undefined;
  errorText?: string | undefined;
}

// Campo de texto con su etiqueta, ayuda y error; la ref llega al <input> (React Hook Form la registra)
export function Input({ label, helperText, errorText, id, className, ...rest }: InputProps) {
  const ids = useFieldIds({ id, helperText, errorText });
  return (
    <Field ids={ids} label={label} helperText={helperText} errorText={errorText}>
      <input
        {...rest}
        id={ids.controlId}
        aria-invalid={errorText === undefined ? undefined : true}
        aria-describedby={ids.describedBy}
        className={cn(controlClassName(errorText !== undefined), className)}
      />
    </Field>
  );
}
