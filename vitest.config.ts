import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'], env: { JEV_SAHTE: '1' } },
  resolve: { alias: { '@': path.resolve(__dirname) } },
});
