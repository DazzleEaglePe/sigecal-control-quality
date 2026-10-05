import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';

const STORAGE_KEY = 'sigecal:sidebar-width';
export const SIDEBAR_WIDTH_MIN_REM = 14;
export const SIDEBAR_WIDTH_MAX_REM = 22;
const DEFAULT_REM = 16.5;

const rootFontSize = (): number =>
  parseFloat(getComputedStyle(document.documentElement).fontSize);
const pxToRem = (px: number): number => px / rootFontSize();
const clamp = (rem: number): number =>
  Math.min(SIDEBAR_WIDTH_MAX_REM, Math.max(SIDEBAR_WIDTH_MIN_REM, rem));

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

const usePointerDrag = (
  widthRem: number,
  setWidthRem: Dispatch<SetStateAction<number>>,
) => {
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: PointerEvent): void => {
      setWidthRem(
        clamp(startWidth.current + pxToRem(event.clientX - startX.current)),
      );
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
  }, [dragging, setWidthRem]);

  const startDrag = useCallback(
    (event: ReactPointerEvent) => {
      startX.current = event.clientX;
      startWidth.current = widthRem;
      setDragging(true);
    },
    [widthRem],
  );

  return { dragging, startDrag };
};

/** Arrastre del borde del panel, al estilo del asa que separa el listado del
 * detalle en apps de escritorio. Solo aplica con el menú expandido. */
export const useSidebarWidth = (): {
  readonly dragging: boolean;
  readonly resizeTo: (widthRem: number) => void;
  readonly startDrag: (event: ReactPointerEvent) => void;
  readonly widthRem: number;
} => {
  const [widthRem, setWidthRem] = useState(readPreference);
  const pointer = usePointerDrag(widthRem, setWidthRem);

  useEffect(() => {
    if (pointer.dragging) return;
    persist(widthRem);
  }, [pointer.dragging, widthRem]);

  return {
    ...pointer,
    resizeTo: (nextWidthRem) => {
      setWidthRem(clamp(nextWidthRem));
    },
    widthRem,
  };
};
