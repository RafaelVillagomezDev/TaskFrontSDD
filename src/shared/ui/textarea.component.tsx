import type { ComponentPropsWithRef } from 'react';

import { cn } from '../utils/class-names.util';
import { controlClassName, Field, type HelperTone } from './field.component';
import { useFieldIds } from './use-field-ids.hook';

interface TextareaProps extends ComponentPropsWithRef<'textarea'> {
  label: string;
  helperText?: string | undefined;
  helperTone?: HelperTone | undefined;
  errorText?: string | undefined;
}

export function Textarea({
  label,
  helperText,
  helperTone,
  errorText,
  id,
  className,
  ...rest
}: Readonly<TextareaProps>) {
  const ids = useFieldIds({ id, helperText, errorText });
  return (
    <Field ids={ids} label={label} helperText={helperText} helperTone={helperTone} errorText={errorText}>
      <textarea
        {...rest}
        id={ids.controlId}
        aria-invalid={errorText === undefined ? undefined : true}
        aria-describedby={ids.describedBy}
        className={cn(controlClassName(errorText !== undefined, false), 'min-h-24', className)}
      />
    </Field>
  );
}
