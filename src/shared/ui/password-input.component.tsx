import { Eye, EyeOff } from 'lucide-react';

import { COMMON_TEXTS } from '../texts/common.texts';
import { cn } from '../utils/class-names.util';
import { Button } from './button.component';
import { controlClassName, Field } from './field.component';
import { Icon } from './icon.component';
import type { InputProps } from './input.component';
import { useFieldIds } from './use-field-ids.hook';
import { usePasswordVisibility } from './use-password-visibility.hook';

// Contraseña con la opción de mostrarla (spec S-11); nunca se recorta
export function PasswordInput({ label, helperText, errorText, id, className, ...rest }: Omit<InputProps, 'type'>) {
  const ids = useFieldIds({ id, helperText, errorText });
  const { visible, toggle } = usePasswordVisibility();
  return (
    <Field ids={ids} label={label} helperText={helperText} errorText={errorText}>
      <div className="relative">
        <input
          {...rest}
          id={ids.controlId}
          type={visible ? 'text' : 'password'}
          aria-invalid={errorText === undefined ? undefined : true}
          aria-describedby={ids.describedBy}
          className={cn(controlClassName(errorText !== undefined), 'pr-12', className)}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={visible ? COMMON_TEXTS.hidePassword : COMMON_TEXTS.showPassword}
          className="absolute inset-y-0 right-0"
        >
          <Icon icon={visible ? EyeOff : Eye} />
        </Button>
      </div>
    </Field>
  );
}
