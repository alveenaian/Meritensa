import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  plugins: [
    {
      name: 'debug-plugins',
      configResolved(config) {
        console.log('ACTIVE_PLUGINS:', config.plugins.map((p) => p.name).join(', '));
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    globals: true,
  },
})