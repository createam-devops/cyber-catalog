import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import scopeToStoreRoot from './scope-css.mjs';

/*
 * El editor de la tienda como componente web <catalog-panel>, para que el ERP
 * lo monte en Venta online › Tienda, igual que el CRM.
 * Contrato: cyberERP/PETICION_ERP_AL_CATALOGO_PANEL.md.
 *
 *   npm run build:embed  →  public/erp-panel/  (el catálogo lo sirve en /erp-panel/;
 *                           el ERP lo publica en su dominio como /apps/catalog/)
 *   npm run dev:embed    →  página de prueba que simula el ERP (index.html)
 *
 * Archivos con huella en el nombre y un manifest.json que dice cuál es cuál: el
 * ERP lee el manifiesto sin caché y luego los archivos, que se guardan para siempre.
 */
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ command }) => ({
  root: here('.'),
  base: './',
  publicDir: false,
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss({ config: here('./tailwind.config.cjs') }), autoprefixer(), scopeToStoreRoot()],
    },
  },
  // En modo biblioteca Vite no sustituye esta variable, y React la consulta.
  define: command === 'build' ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
  resolve: { alias: { '@shared': here('../../src/lib') } },
  server: {
    port: 4320,
    strictPort: true,
    // Como en el ERP: la API vive bajo el prefijo del paquete, en el mismo origen.
    proxy: {
      '/apps/catalog/api': { target: process.env.CATALOG_DEV_SERVER || 'http://localhost:3110', rewrite: (path) => path.replace('/apps/catalog/api', '/erp-panel/api') },
      // Login de un ERP simulado para conseguir un token aud=catalog en la página de prueba.
      '/mock-erp': { target: process.env.MOCK_ERP_URL || 'http://localhost:4010', rewrite: (path) => path.replace('/mock-erp', '') },
    },
  },
  build: {
    outDir: here('../../public/erp-panel'),
    emptyOutDir: true,
    manifest: 'manifest.json',
    cssCodeSplit: false,
    lib: { entry: here('src/element.tsx'), formats: ['es'], fileName: 'catalog-panel' },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/catalog-panel-[hash].js',
        // Un solo JS: sin trozos aparte (contrato §3).
        inlineDynamicImports: true,
        assetFileNames: (asset) => (asset.name?.endsWith('.css') ? 'assets/catalog-panel-[hash][extname]' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
}));
