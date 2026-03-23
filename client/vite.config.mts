import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { apiProxyDynamic } from './vite-plugin-api-proxy.mjs';

export default defineConfig({
  plugins: [vue(), apiProxyDynamic()],
  server: {
    port: 5173
  }
});

