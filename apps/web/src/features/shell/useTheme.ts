import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sigecal:theme';
type Theme = 'dark' | 'light';

const readPreference = (): Theme => {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) === 'light'
      ? 'light'
      : 'dark';
  } catch {
    return 'dark';
  }
};

const apply = (theme: Theme): void => {
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.style.colorScheme = theme;
};

const persist = (theme: Theme): void => {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sin almacenamiento disponible el tema dura solo la sesión.
  }
};

/** Se ejecuta una vez al arrancar la aplicación, antes de montar React, para
 * que cualquier ruta cargue con el tema guardado y no solo la de Ajustes,
 * donde vive el interruptor. */
export const applyStoredTheme = (): void => {
  apply(readPreference());
};

/** Oscuro es el tema por defecto de SIGECAL; claro es la alternativa que
 * cada persona puede elegir para su propia sesión de navegador. */
export const useTheme = (): {
  readonly theme: Theme;
  readonly toggle: () => void;
} => {
  const [theme, setTheme] = useState<Theme>(readPreference);

  useEffect(() => {
    apply(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      persist(next);
      return next;
    });
  }, []);

  return { theme, toggle };
};
