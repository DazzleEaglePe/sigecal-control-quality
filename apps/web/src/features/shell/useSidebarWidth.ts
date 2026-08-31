import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';

const STORAGE_KEY = 'sigecal:sidebar-width';
const MIN_REM = 14;
const MAX_REM = 22;
const DEFAULT_REM = 16.5;

const rootFontSize = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);
const pxToRem = (px: number): number => px / rootFontSize();
const clamp = (rem: number): number =>
  Math.min(MAX_REM, Math.max(MIN_REM, rem));

const readPreference = (): number => {
  try {
    const raw = Number(globalThis.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(raw) && raw > 0 ? clamp(raw) : DEFAULT_REM;
  } catch {
    return DEFAULT_REM;
  }
};

const persist = (rem: number): void => {
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, String(rem));
  } catch {
    // Sin almacenamiento disponible el ancho dura solo la sesión.
  }
};

/** Arrastre del borde del panel, al estilo del asa que separa el listado del
 * detalle en apps de escritorio. Solo aplica con el menú expandido. */
export const useSidebarWidth = (): {
  readonly dragging: boolean;
  readonly startDrag: (event: ReactPointerEvent) => void;
  readonly widthRem: number;
} => {
  const [widthRem, setWidthRem] = useState(readPreference);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent): void => {
      const deltaPx = event.clientX - startX.current;
      setWidthRem(clamp(startWidth.current + pxToRem(deltaPx)));
    };
    const onUp = (): void => {
      setDragging(false);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (dragging) return;
    persist(widthRem);
  }, [dragging, widthRem]);

  const startDrag = useCallback(
    (event: ReactPointerEvent) => {
      startX.current = event.clientX;
      startWidth.current = widthRem;
      setDragging(true);
    },
    [widthRem],
  );

  return { dragging, startDrag, widthRem };
};
