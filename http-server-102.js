const http = require('http');
const path = require('path');
const fs = require('fs');

// 1. Updated path: Point to 'dist' instead of '.next'
const NextServer = require('./dist/standalone/node_modules/next/dist/server/next-server').default;

// 2. Updated path: Load config from 'dist'
const configPath = path.join(__dirname, 'dist/standalone/dist/required-server-files.json');
const requiredConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const nextHandler = new NextServer({
  hostname: '0.0.0.0',
  port: 8443,
  dir: path.join(__dirname, 'dist/standalone'), // Point to the standalone root
  distDir: 'dist', // MUST match your next.config.js
  dev: false,
  conf: requiredConfig.config,
  customServer: true,
}).getRequestHandler();

const server = http.createServer(async (req, res) => {
  try {
    await nextHandler(req, res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Error');
  }
});

server.listen(8443, () => {
  console.log(`> Server listening on 8443 with distDir: dist`);
});