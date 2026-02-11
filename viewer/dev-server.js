import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3001;
const folder = process.argv[2];

if (!folder) {
  console.error('Usage: node dev-server.js /path/to/published/folder');
  process.exit(1);
}

const root = path.resolve(folder);

if (!fs.existsSync(root)) {
  console.error(`Directory not found: ${root}`);
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ktx2': 'image/ktx2',
  '.bin': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const filePath = path.join(root, decodeURIComponent(url.pathname));

  // Prevent directory traversal
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache',
  });

  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\nOzone Viewer Dev Server`);
  console.log(`Serving: ${root}`);
  console.log(`URL:     http://localhost:${PORT}`);
  console.log(`\nOpen viewer at: http://localhost:5174/?base=http://localhost:${PORT}\n`);
});
