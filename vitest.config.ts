import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    // Playwright specs live under tests/e2e — use `pnpm test:e2e` for those.
    exclude: ['**/node_modules/**', '**/dist/**', '**/.output/**', '**/tests/e2e/**'],
  },
});
