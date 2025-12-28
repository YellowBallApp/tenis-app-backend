import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Vercel deploy için base path - root domain için '/'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Tüm CSS'i tek bir dosyada topla (Tailwind + custom CSS)
    cssCodeSplit: false,
    // Sourcemap'i devre dışı bırak (production için)
    sourcemap: false,
    // CSS minification
    cssMinify: true,
    rollupOptions: {
      output: {
        // CSS dosyası için özel isimlendirme - Tailwind CSS dahil
        assetFileNames: (assetInfo) => {
          // CSS dosyaları için
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/index-[hash][extname]';
          }
          // Diğer asset'ler için
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  // CSS işleme için optimize et
  css: {
    devSourcemap: false,
    postcss: './postcss.config.js',
  },
})
