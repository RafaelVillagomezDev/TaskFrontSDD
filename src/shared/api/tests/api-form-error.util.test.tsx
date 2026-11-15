import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { showApiError } from '../api-form-error.util';

interface Values {
  title: string;
  date: string;
}

const FIELDS: readonly (keyof Values)[] = ['title', 'date'];

function apiError(status: number, code: string, details?: { field: string; message: string }[]) {
  return { status, data: { success: false, status, error: { code, message: 'x', ...(details ? { details } : {}) } } };
}

// formState se lee en el render para que React Hook Form vuelva a pintar con los errores
function setup() {
  const { result } = renderHook(() => {
    const form = useForm<Values>({ defaultValues: { title: 'Pan', date: '2026-10-30' } });
    return { form, errors: form.formState.errors };
  });
  return result;
}

describe('RF-41: showApiError', () => {
  it('marca cada campo rechazado con el mensaje del cliente y no añade error general', () => {
    const result = setup();
    act(() => {
      showApiError(
        result.current.form,
        apiError(400, 'VALIDATION_ERROR', [
          { field: 'title', message: 'Demasiado grande: se esperaba que texto tuviera <=200 caracteres' },
          { field: 'body', message: 'JSON mal formado' },
        ]),
        FIELDS,
      );
    });
    expect(result.current.errors.title?.message).toBe('Revisa este campo.');
    expect(result.current.errors.date).toBeUndefined();
    expect(result.current.errors.root).toBeUndefined();
    expect(result.current.form.getValues()).toEqual({ title: 'Pan', date: '2026-10-30' });
  });

  it('sin campos del formulario, el mensaje del código va al error general', () => {
    const result = setup();
    act(() => {
      showApiError(result.current.form, apiError(400, 'VALIDATION_ERROR', [{ field: 'body', message: 'x' }]), FIELDS);
    });
    expect(result.current.errors.root?.server?.message).toBe('Revisa los campos marcados.');
  });

  it('un error que no es de validación va al error general con su mensaje', () => {
    const result = setup();
    act(() => {
      showApiError(result.current.form, apiError(409, 'DAY_CLOSED'), FIELDS);
    });
    expect(result.current.errors.root?.server?.message).toBe(
      'Ese día ya está cerrado: sus tareas no se pueden cambiar.',
    );
  });
});
