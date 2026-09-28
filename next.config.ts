import path from 'node:path';
import type { NextConfig } from 'next';

const ayarlar: NextConfig = {
  poweredByHeader: false,
  // Ekran kaydında köşedeki Next.js göstergesi görünmesin.
  devIndicators: false,
  // Üst dizinlerde başka lockfile var; kökü bu alt proje olarak sabitle.
  outputFileTracingRoot: path.resolve('.'),
};

export default ayarlar;
