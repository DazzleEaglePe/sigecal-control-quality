import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '../..', '');
  return {
    envDir: '../..',
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(environment.WEB_PORT ?? 5173),
      strictPort: true,
    },
    build: { chunkSizeWarningLimit: 550 },
    preview: { port: 4173, strictPort: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
    },
  };
});
