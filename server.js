// server.js
const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// OpenShift Service Serving Certs paths
const options = {
  key: fs.readFileSync('/etc/tls/tls.key'),
  cert: fs.readFileSync('/etc/tls/tls.crt'),
};

app.prepare().then(() => {
  createServer(options, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(8443, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:8443');
  });
});