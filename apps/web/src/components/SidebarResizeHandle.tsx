import type { KeyboardEvent, PointerEvent } from 'react';

import {
  SIDEBAR_WIDTH_MAX_REM,
  SIDEBAR_WIDTH_MIN_REM,
} from '../features/shell/useSidebarWidth.js';

const KEYBOARD_STEP_REM = 0.5;

interface SidebarResizeHandleProps {
  readonly startResize: (event: PointerEvent<HTMLDivElement>) => void;
  readonly resizeTo: (widthRem: number) => void;
  readonly widthRem: number;
}

const widthForKey = (key: string, current: number): number | undefined => {
  if (key === 'ArrowLeft')
    return Math.max(SIDEBAR_WIDTH_MIN_REM, current - KEYBOARD_STEP_REM);
  if (key === 'ArrowRight')
    return Math.min(SIDEBAR_WIDTH_MAX_REM, current + KEYBOARD_STEP_REM);
  if (key === 'Home') return SIDEBAR_WIDTH_MIN_REM;
  if (key === 'End') return SIDEBAR_WIDTH_MAX_REM;
  return undefined;
};

const handleKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  widthRem: number,
  resizeTo: SidebarResizeHandleProps['resizeTo'],
): void => {
  const nextWidth = widthForKey(event.key, widthRem);
  if (nextWidth === undefined) return;
  event.preventDefault();
  resizeTo(nextWidth);
};

export const SidebarResizeHandle = ({
  startResize,
  resizeTo,
  widthRem,
}: SidebarResizeHandleProps): React.JSX.Element => (
  <div
    className="sidebar-resize-handle"
    role="separator"
    tabIndex={0}
    aria-orientation="vertical"
    aria-label="Ajustar el ancho del menú"
    aria-valuemin={SIDEBAR_WIDTH_MIN_REM}
    aria-valuemax={SIDEBAR_WIDTH_MAX_REM}
    aria-valuenow={Number(widthRem.toFixed(1))}
    aria-valuetext={`${widthRem.toFixed(1)} rem`}
    onPointerDown={startResize}
    onKeyDown={(event) => {
      handleKeyDown(event, widthRem, resizeTo);
    }}
  />
);
