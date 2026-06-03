const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';
const DIST_DIR = path.join(__dirname, '..', 'packages', 'web', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal server error');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function getPathFromUrl(url) {
  const rawPath = (url || '/').split('?')[0];
  const decoded = decodeURIComponent(rawPath);
  const normalized = path.normalize(decoded).replace(/^\.+/, '');
  return normalized === path.sep ? '/index.html' : normalized;
}

const server = http.createServer((req, res) => {
  const requestPath = getPathFromUrl(req.url);
  const filePath = path.join(DIST_DIR, requestPath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(res, filePath);
      return;
    }

    const indexPath = path.join(DIST_DIR, 'index.html');
    fs.access(indexPath, fs.constants.R_OK, indexErr => {
      if (indexErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Build output not found: packages/web/dist/index.html');
        return;
      }

      sendFile(res, indexPath);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Vehicle Vitals App Hosting server listening on ${HOST}:${PORT}`);
});
