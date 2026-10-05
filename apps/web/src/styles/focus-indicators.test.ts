import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(
  resolve(process.cwd(), 'src/styles.css'),
  'utf8',
);
type ThemeToken =
  | 'ring'
  | 'background'
  | 'foreground'
  | 'card'
  | 'card-foreground'
  | 'popover'
  | 'popover-foreground'
  | 'primary'
  | 'primary-foreground'
  | 'secondary'
  | 'secondary-foreground'
  | 'muted'
  | 'muted-foreground'
  | 'accent'
  | 'accent-foreground'
  | 'destructive'
  | 'destructive-foreground'
  | 'success'
  | 'warning'
  | 'border'
  | 'input';

const themeColors = (selector: string): Record<ThemeToken, string> => {
  const declarations = new RegExp(`${selector}\\s*\\{([^}]+)\\}`).exec(
    stylesheet,
  )?.[1];
  if (!declarations) throw new Error(`No se encontró el tema ${selector}.`);

  const names: ThemeToken[] = [
    'ring',
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'accent',
    'accent-foreground',
    'destructive',
    'destructive-foreground',
    'success',
    'warning',
    'border',
    'input',
  ];
  const tokens = Object.fromEntries(
    names.map((name) => {
      const tokenName = name.replace('-', '\\-');
      const value = new RegExp(`--${tokenName}:\\s*(#[0-9a-fA-F]{6})`).exec(
        declarations,
      )?.[1];
      if (!value) throw new Error(`Falta el token --${name} en ${selector}.`);
      return [name, value];
    }),
  ) as Record<ThemeToken, string>;

  return tokens;
};

const linearChannel = (hex: string, offset: number): number => {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number =>
  0.2126 * linearChannel(hex, 1) +
  0.7152 * linearChannel(hex, 3) +
  0.0722 * linearChannel(hex, 5);

const contrastRatio = (first: string, second: string): number => {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  const [lighter, darker] = values;
  if (lighter === undefined || darker === undefined)
    throw new Error('El contraste requiere dos colores.');
  return (lighter + 0.05) / (darker + 0.05);
};

describe('focus ring theme contrast', () => {
  it('aplica un indicador visible a todos los controles de formulario', () => {
    expect(stylesheet).toMatch(
      /button:focus-visible,\s*a:focus-visible,\s*input:focus,\s*select:focus,\s*textarea:focus,\s*\[tabindex\]:focus-visible\s*\{/,
    );
  });

  it.each([':root', '\\.light'])('mantiene contraste 3:1 en %s', (selector) => {
    const colors = themeColors(selector);
    const surfaces: ThemeToken[] = [
      'background',
      'card',
      'secondary',
      'muted',
      'border',
      'input',
    ];

    for (const surface of surfaces) {
      expect(
        contrastRatio(colors.ring, colors[surface]),
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('theme text contrast', () => {
  const textPairs: [ThemeToken, ThemeToken][] = [
    ['foreground', 'background'],
    ['foreground', 'card'],
    ['card-foreground', 'card'],
    ['popover-foreground', 'popover'],
    ['primary-foreground', 'primary'],
    ['secondary-foreground', 'secondary'],
    ['muted-foreground', 'muted'],
    ['muted-foreground', 'card'],
    ['accent-foreground', 'accent'],
    ['destructive-foreground', 'destructive'],
    ['destructive', 'card'],
    ['success', 'card'],
    ['warning', 'card'],
  ];

  it.each([':root', '\\.light'])(
    'mantiene contraste de texto AA en %s',
    (selector) => {
      const colors = themeColors(selector);

      for (const [text, surface] of textPairs) {
        expect(
          contrastRatio(colors[text], colors[surface]),
          `--${text} sobre --${surface} en ${selector}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
