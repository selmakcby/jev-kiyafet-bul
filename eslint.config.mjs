import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const kok = dirname(fileURLToPath(import.meta.url));
const uyum = new FlatCompat({ baseDirectory: kok });

const ayarlar = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...uyum.extends('next/core-web-vitals', 'next/typescript'),
  { rules: { 'no-console': 'error' } },
];

export default ayarlar;
