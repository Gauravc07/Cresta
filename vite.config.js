import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cacheControl, securityHeaders } from './security.config.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const brotli = promisify(zlib.brotliCompress);
const gzip = promisify(zlib.gzip);
const COMPRESSIBLE = /\.(js|mjs|css|html|svg|json|txt|xml|webmanifest)$/;

/** Applies security + cache headers to the dev server, and pre-compresses text assets on build. */
function cresta(isSsr) {
  const withHeaders = (headers) => (req, res, next) => {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    res.setHeader('Cache-Control', cacheControl(req.url.split('?')[0]));
    next();
  };
  let outDir = 'dist';

  return {
    name: 'cresta-security',
    configResolved(cfg) { outDir = path.resolve(cfg.root, cfg.build.outDir); },
    configureServer(server) {
      server.middlewares.use(withHeaders(securityHeaders({ dev: true })));
    },
    async closeBundle() {
      if (isSsr) return;
      // Pre-compress text assets so servers can send .br / .gz without CPU cost per request.
      const walk = async (dir) => (await Promise.all((await readdir(dir, { withFileTypes: true })).map((d) => {
        const p = path.join(dir, d.name);
        return d.isDirectory() ? walk(p) : [p];
      }))).flat();
      let count = 0;
      for (const file of await walk(outDir)) {
        if (!COMPRESSIBLE.test(file) || file === path.join(outDir, 'index.html') || (await stat(file)).size < 1024) continue;
        const buf = await readFile(file);
        await writeFile(`${file}.br`, await brotli(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }));
        await writeFile(`${file}.gz`, await gzip(buf, { level: 9 }));
        count += 1;
      }
      this.info?.(`${count} files precompressed`);
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), cresta(!!isSsrBuild)],
  server: {
    port: 5173,
    // In development the API runs on the production server (npm start).
    proxy: { '/api': 'http://127.0.0.1:8080', '/media': 'http://127.0.0.1:8080' },
  },
  preview: { port: 4173 },
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 0, // keep everything as files so the CSP never needs data: scripts/styles
    ...(isSsrBuild ? { copyPublicDir: false } : {
      rollupOptions: {
        input: { main: path.join(HERE, 'index.html'), admin: path.join(HERE, 'admin/index.html') },
        output: { manualChunks: { react: ['react', 'react-dom', 'react-dom/client', 'react-router-dom'] } },
      },
    }),
  },
}));
