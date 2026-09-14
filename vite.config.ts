import { defineConfig } from 'vite';

// base is set by the Pages workflow (repo sub-path); empty locally.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  build: { target: 'es2022' },
});
