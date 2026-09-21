import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, '../..', '');
  return {
    envDir: '../..',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/sigecal-pwa.svg'],
        manifest: {
          name: 'SIGECAL — Control de Calidad',
          short_name: 'SIGECAL',
          description:
            'Sistema de Gestión de Control de Calidad para la elaboración de pisco.',
          lang: 'es-PE',
          theme_color: '#052e1d',
          background_color: '#07110d',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/icons/sigecal-pwa.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          // Solo se precachea el shell y recursos estáticos. Las respuestas
          // operativas requieren autorización y nunca se guardan entre sesiones.
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
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
