import { render, screen } from '@testing-library/react';

import { DateInput } from '../date-input.component';
import { Input } from '../input.component';
import { SelectNative } from '../select-native.component';
import { Textarea } from '../textarea.component';

describe('Field: etiqueta, ayuda y error accesibles en todos los campos', () => {
  it('la etiqueta nombra al campo', () => {
    render(<Input label="Título" />);
    expect(screen.getByRole('textbox', { name: 'Título' })).toBeInTheDocument();
  });

  it('la ayuda describe el campo', () => {
    render(<Input label="Título" helperText="Máximo 200 caracteres" />);
    expect(screen.getByRole('textbox', { name: 'Título' })).toHaveAccessibleDescription('Máximo 200 caracteres');
  });

  it('RF-02: el error se muestra bajo el campo, lo describe y lo marca como inválido', () => {
    render(<Input label="Título" helperText="Máximo 200 caracteres" errorText="El título es obligatorio." />);
    const input = screen.getByRole('textbox', { name: 'Título' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Máximo 200 caracteres El título es obligatorio.');
    expect(screen.getByText('El título es obligatorio.').className).toContain('text-danger-text');
  });

  it('sin error no está marcado como inválido', () => {
    render(<Input label="Título" />);
    expect(screen.getByRole('textbox', { name: 'Título' })).not.toHaveAttribute('aria-invalid');
  });

  it('respeta un id explícito', () => {
    render(<Input label="Email" id="login-email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('id', 'login-email');
  });
});

describe('estilo de los campos según DESIGN.md (Inputs)', () => {
  it('borde, radius-md, padding y foco en primary; en móvil al menos 44 px', () => {
    render(<Input label="Título" />);
    const classes = screen.getByRole('textbox').className;
    for (const expected of ['border-border-input', 'rounded-md', 'px-4', 'focus:outline-primary', 'min-h-touch']) {
      expect(classes).toContain(expected);
    }
  });

  it('con error el borde es de peligro', () => {
    render(<Input label="Título" errorText="Error" />);
    expect(screen.getByRole('textbox').className).toContain('border-danger');
  });
});

describe('tipos de campo', () => {
  it('Textarea', () => {
    render(<Textarea label="Descripción" rows={3} />);
    expect(screen.getByRole('textbox', { name: 'Descripción' }).tagName).toBe('TEXTAREA');
  });

  it('DateInput', () => {
    render(<DateInput label="Fecha" />);
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('type', 'date');
  });

  it('SelectNative con sus opciones como children', () => {
    render(
      <SelectNative label="Estado">
        <option value="all">Todas</option>
        <option value="pending">Pendientes</option>
      </SelectNative>,
    );
    expect(screen.getByRole('combobox', { name: 'Estado' })).toHaveValue('all');
  });
});
