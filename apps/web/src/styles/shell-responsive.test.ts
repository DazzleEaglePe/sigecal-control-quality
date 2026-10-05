import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(
  resolve(process.cwd(), 'src/styles/sidebar-collapse.css'),
  'utf8',
);
const applicationStylesheet = readFileSync(
  resolve(process.cwd(), 'src/styles.css'),
  'utf8',
);

describe('mobile application shell', () => {
  it('does not reserve desktop sidebar width for the mobile drawer', () => {
    expect(stylesheet).toMatch(
      /@media \(max-width: 850px\)[\s\S]*?\.workspace\s*\{\s*margin-left:\s*0;/,
    );
  });

  it('hides a closed mobile drawer from keyboard and assistive navigation', () => {
    expect(applicationStylesheet).toMatch(
      /@media \(max-width: 850px\)[\s\S]*?\.sidebar\s*\{[^}]*visibility:\s*hidden;[^}]*\}[\s\S]*?\.sidebar\.is-open\s*\{[^}]*visibility:\s*visible;/,
    );
  });
});
