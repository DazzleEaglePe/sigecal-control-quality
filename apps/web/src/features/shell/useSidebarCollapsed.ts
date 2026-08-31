import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sigecal:sidebar-collapsed';

/** Preferencia de interfaz, no dato de sesión: ADR-011 restringe `localStorage`
 * para tokens, no para ajustes de presentación. */
const readPreference = (): boolean => {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const persist = (value: boolean): void => {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Sin almacenamiento disponible la preferencia dura solo la sesión.
  }
};

export const useSidebarCollapsed = (): {
  readonly collapsed: boolean;
  readonly toggle: () => void;
} => {
  const [collapsed, setCollapsed] = useState(readPreference);
  const toggle = useCallback(() => {
    setCollapsed((current) => {
      persist(!current);
      return !current;
    });
  }, []);
  return { collapsed, toggle };
};
