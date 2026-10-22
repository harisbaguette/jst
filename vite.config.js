import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ build: { rollupOptions: { input: { viewer: resolve('index.html'), game: resolve('game.html') } } } });
