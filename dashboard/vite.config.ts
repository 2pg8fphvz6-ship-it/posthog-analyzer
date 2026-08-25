import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serves ../data/ as the static public dir so scores.json is available at /scores.json
export default defineConfig({
  plugins: [react()],
  publicDir: resolve(__dirname, '../data'),
});
