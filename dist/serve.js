#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8888;
const DIR = __dirname;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Normalize path
  if (pathname.endsWith('/') && pathname !== '/') {
    pathname = pathname.slice(0, -1);
  }

  let filePath = path.join(DIR, pathname);
  const ext = path.extname(filePath);

  // If no extension and not a directory request, try to serve as HTML file
  if (!ext && !pathname.endsWith('/')) {
    // First try .html extension
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      filePath = htmlPath;
    } else {
      // Fallback to index.html for SPA routing
      filePath = path.join(DIR, 'index.html');
    }
  }

  // If directory, try index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If file not found, serve index.html for SPA routing
      fs.readFile(path.join(DIR, 'index.html'), (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexData);
      });
      return;
    }

    // Determine content type
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.txt': 'text/plain'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}/`);
  console.log(`✓ Serving files from: ${DIR}`);
  console.log(`✓ SPA routing enabled - unknown routes serve index.html`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Port ${PORT} is already in use`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
