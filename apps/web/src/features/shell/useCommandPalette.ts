import { useEffect, useState } from 'react';

const isEditableTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable);

/** ⌘K/Ctrl+K abre el buscador desde cualquier pantalla, salvo que el foco ya
 * esté en otro campo de escritura. */
export const useCommandPalette = (): {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
} => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const shortcut = (event.metaKey || event.ctrlKey) && event.key === 'k';
      if (!shortcut || isEditableTarget(event.target)) return;
      event.preventDefault();
      setOpen((current) => !current);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return { open, setOpen };
};
