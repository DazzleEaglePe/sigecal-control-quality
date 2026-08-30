import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina clases condicionales y resuelve conflictos de utilidades Tailwind. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
