// Textos visibles del módulo de cuenta (AGENTS.md §4: nunca escritos directamente en el JSX)
export const ACCOUNT_TEXTS = {
  page: {
    title: 'Cuenta',
  },
  profile: {
    title: 'Perfil',
    email: 'Email',
    createdAt: 'Fecha de alta',
    name: 'Nombre (opcional)',
    nameHelp: 'Se muestra en la navegación en lugar de tu email.',
    save: 'Guardar nombre',
    saving: 'Guardando…',
    saved: 'Nombre guardado.',
  },
  // Las contraseñas agrupan sus textos en objetos: un literal junto a una clave «password» parece una credencial
  changePassword: {
    title: 'Cambiar contraseña',
    current: { label: 'Contraseña actual' },
    next: { label: 'Contraseña nueva', help: 'Entre 12 y 128 caracteres.' },
    submit: 'Cambiar contraseña',
    submitting: 'Cambiando…',
    // RF-39: esta sesión sigue abierta y las demás se han cerrado
    changed: 'Contraseña cambiada. Has cerrado sesión en tus otros dispositivos; aquí sigues dentro.',
  },
  deleteAccount: {
    title: 'Borrar cuenta',
    warning: 'Se eliminarán para siempre tu cuenta, todas tus tareas y todos tus avisos. No se puede deshacer.',
    open: 'Borrar mi cuenta',
    dialogTitle: '¿Borrar tu cuenta?',
    confirmPassword: { label: 'Escribe tu contraseña para confirmar' },
    confirm: 'Borrar cuenta',
    deleting: 'Borrando…',
  },
  validation: {
    nameTooLong: 'El nombre no puede tener más de 100 caracteres.',
    password: {
      currentRequired: 'Escribe tu contraseña actual.',
      nextRequired: 'Escribe la contraseña nueva.',
      tooShort: 'La contraseña debe tener al menos 12 caracteres.',
      tooLong: 'La contraseña no puede tener más de 128 caracteres.',
      confirmRequired: 'Escribe tu contraseña para borrar la cuenta.',
    },
  },
};
