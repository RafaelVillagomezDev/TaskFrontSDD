import { useCallback, useState } from 'react';

// Estado de «mostrar contraseña» fuera del componente (CONSTITUTION.md VI.1)
export function usePasswordVisibility(): { visible: boolean; toggle: () => void } {
  const [visible, setVisible] = useState(false);
  const toggle = useCallback(() => {
    setVisible((current) => !current);
  }, []);
  return { visible, toggle };
}
