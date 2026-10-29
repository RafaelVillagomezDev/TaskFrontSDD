// Textos visibles del módulo auth (AGENTS.md §4, spec RNF-01)
export const AUTH_TEXTS = {
  login: {
    title: 'Iniciar sesión',
    submit: 'Entrar',
    submitting: 'Entrando…',
    noAccount: '¿Aún no tienes cuenta?',
    toRegister: 'Crear una cuenta',
    // RF-01: tras registrarse
    registered: 'Cuenta creada. Ya puedes iniciar sesión.',
    // RF-07: la sesión no se pudo renovar
    expired: 'Tu sesión ha caducado. Inicia sesión de nuevo.',
  },
  register: {
    title: 'Crear cuenta',
    submit: 'Crear cuenta',
    submitting: 'Creando cuenta…',
    hasAccount: '¿Ya tienes cuenta?',
    toLogin: 'Iniciar sesión',
  },
  // Las contraseñas agrupan sus textos en objetos: un literal junto a una clave «password» parece una credencial
  fields: {
    email: 'Email',
    password: { label: 'Contraseña', help: 'Entre 12 y 128 caracteres.' },
    name: 'Nombre (opcional)',
  },
  // Mensajes de validación bajo cada campo (RF-02, RF-46)
  validation: {
    emailRequired: 'Escribe tu email.',
    emailInvalid: 'Escribe un email válido, como ana@ejemplo.com.',
    emailTooLong: 'El email no puede tener más de 254 caracteres.',
    password: {
      required: 'Escribe tu contraseña.',
      tooShort: 'La contraseña debe tener al menos 12 caracteres.',
      tooLong: 'La contraseña no puede tener más de 128 caracteres.',
    },
    nameTooLong: 'El nombre no puede tener más de 100 caracteres.',
  },
  logout: 'Cerrar sesión',
};
