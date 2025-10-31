import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/n8n': {
        target: 'https://primary-production-f465.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/n8n/, '/webhook/547531b3-5c5a-4b5e-82d5-8170253a01a4'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 Proxy error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('🌐 Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})
