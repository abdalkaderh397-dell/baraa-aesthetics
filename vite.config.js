import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'spa',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin/index.html')
      }
    }
  },
  plugins: [
    {
      name: 'admin-static-route',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '/';

          if (url === '/admin' || url === '/admin/' || url.startsWith('/admin/')) {
            const adminFile = path.resolve(__dirname, 'admin/index.html');

            if (fs.existsSync(adminFile)) {
              const html = fs.readFileSync(adminFile, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html);
              return;
            }
          }

          next();
        });
      }
    }
  ]
});
