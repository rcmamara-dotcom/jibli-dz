import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base doit correspondre au nom du dépôt GitHub Pages : https://<user>.github.io/jibli-dz/
export default defineConfig({
  base: '/jibli-dz/',
  plugins: [react()],
});
