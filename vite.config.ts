import { defineConfig } from 'vitest/config';

const SERVER_PORT = Number.parseInt(process.env['PORT'] ?? '8787', 10);

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    // Phaser alone is ~1.2 MB minified. Raising the limit documents that we know.
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        // Keep the engine in its own chunk so game-code changes invalidate a
        // ~11 kB bundle instead of re-downloading Phaser.
        codeSplitting: {
          groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'server/**/*.ts', 'shared/**/*.ts'],
      exclude: ['src/main.ts', 'src/game/scenes/**', '**/*.d.ts'],
    },
  },
});
