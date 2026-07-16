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

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com",
    "frame-src 'self' https://www.googletagmanager.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.firebasedatabase.app https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://www.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://www.google.com https://accounts.google.com https://stats.g.doubleclick.net",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ].join('; ')
};

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, {
        ...SECURITY_HEADERS,
        'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end('Internal server error');
      return;
    }

    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': contentType
    });
    res.end(data);
  });
}

function getPathFromUrl(url) {
  const rawPath = (url || '/').split('?')[0];
  let decoded = '/';
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  const normalized = path.normalize(decoded).replace(/^\.+/, '');
  return normalized === path.sep ? '/index.html' : normalized;
}

const server = http.createServer((req, res) => {
  const requestPath = getPathFromUrl(req.url);
  if (!requestPath) {
    res.writeHead(400, {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('Bad request');
    return;
  }
  const filePath = path.join(DIST_DIR, requestPath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8'
    });
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
        res.writeHead(500, {
          ...SECURITY_HEADERS,
          'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end('Build output not found: packages/web/dist/index.html');
        return;
      }

      sendFile(res, indexPath);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Vehicle-Vitals App Hosting server listening on ${HOST}:${PORT}`);
});
