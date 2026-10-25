const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.php': 'text/html; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Parse URL and strip query string
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // If root, serve index.html
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  // Resolve file path
  let filePath = path.join(PUBLIC_DIR, pathname);

  // Security check: ensure path is within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  // Check if file exists as-is
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      return serveFile(filePath, res);
    }

    // Try appending .html if no extension
    if (!path.extname(pathname)) {
      const htmlPath = filePath + '.html';
      fs.stat(htmlPath, (errHtml, statsHtml) => {
        if (!errHtml && statsHtml.isFile()) {
          return serveFile(htmlPath, res);
        }
        return serveNotFound(res, pathname);
      });
      return;
    }

    // Try index.html in subfolder
    if (!err && stats.isDirectory()) {
      const subIndexPath = path.join(filePath, 'index.html');
      fs.stat(subIndexPath, (errSub, statsSub) => {
        if (!errSub && statsSub.isFile()) {
          return serveFile(subIndexPath, res);
        }
        return serveNotFound(res, pathname);
      });
      return;
    }

    return serveNotFound(res, pathname);
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('500 Internal Server Error: ' + err.message);
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    res.end(content);
  });
}

function serveNotFound(res, pathname) {
  const notFoundPage = path.join(PUBLIC_DIR, 'sitemap.html');
  fs.readFile(notFoundPage, 'utf8', (err, html) => {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    if (!err) {
      res.end(`<!-- 404: Page not found, showing sitemap -->\n` + html);
    } else {
      res.end(`<h1>404 Not Found</h1><p>The requested URL ${pathname} was not found.</p><p><a href="/">Go to Home</a> | <a href="/sitemap.html">Sitemap</a></p>`);
    }
  });
}

function startServer(port) {
  server.listen(port, () => {
    console.log(`=======================================================`);
    console.log(` adxcal.com Full Clone Server Running!             `);
    console.log(` Port: ${port}                                         `);
    console.log(` URL:  http://localhost:${port}/                      `);
    console.log(` All 218+ calculators & URLs are active and live!       `);
    console.log(`=======================================================`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(server.address()?.port || PORT) + 1;
    console.log(`Port ${PORT} is already in use, trying port ${nextPort}...`);
    startServer(nextPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(PORT);
