import type { ComponentPropsWithRef } from 'react';

import { cn } from '../utils/class-names.util';
import { controlClassName, Field } from './field.component';
import { useFieldIds } from './use-field-ids.hook';

interface SelectNativeProps extends ComponentPropsWithRef<'select'> {
  label: string;
  helperText?: string | undefined;
  errorText?: string | undefined;
}

// Selector nativo: accesible con teclado y lector de pantalla sin lógica propia; las opciones van en children
export function SelectNative({ label, helperText, errorText, id, className, ...rest }: Readonly<SelectNativeProps>) {
  const ids = useFieldIds({ id, helperText, errorText });
  return (
    <Field ids={ids} label={label} helperText={helperText} errorText={errorText}>
      <select
        {...rest}
        id={ids.controlId}
        aria-invalid={errorText === undefined ? undefined : true}
        aria-describedby={ids.describedBy}
        className={cn(controlClassName(errorText !== undefined), className)}
      />
    </Field>
  );
}
