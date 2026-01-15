const https = require('https');
const path = require('path');
const fs = require('fs');

// 1. Load the NextServer class from the standalone node_modules
const NextServer = require('./dist/standalone/node_modules/next/dist/server/next-server').default;

// 2. Load the build configuration
const configPath = path.join(__dirname, 'dist/standalone/dist/required-server-files.json');
const requiredConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 3. Load SSL certificates
const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

// 4. Initialize the Next.js handler with correct paths for dist directory
const nextHandler = new NextServer({
  hostname: '0.0.0.0',
  port: 8443,
  dir: path.join(__dirname, 'dist/standalone'),
  distDir: 'dist',
  dev: false,
  conf: requiredConfig.config,
  customServer: true,
}).getRequestHandler();

// 5. Create the HTTPS server
const server = https.createServer(options, async (req, res) => {
  try {
    // Handle static files manually if needed
    if (req.url.startsWith('/_next/static/')) {
      const staticPath = path.join(__dirname, 'dist/standalone/dist/static', req.url.replace('/_next/static', ''));
      console.log('Looking for static file:', staticPath);
      if (fs.existsSync(staticPath)) {
        const ext = path.extname(staticPath);
        const contentType = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.map': 'application/json'
        }[ext] || 'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        fs.createReadStream(staticPath).pipe(res);
        return;
      } else {
        console.log('Static file not found:', staticPath);
      }
    }
    
    // Handle public assets
    if (req.url.startsWith('/') && !req.url.startsWith('/_next') && !req.url.startsWith('/api')) {
      const publicPath = path.join(__dirname, 'dist/standalone/public', req.url);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        const ext = path.extname(publicPath);
        const contentType = {
          '.ico': 'image/x-icon',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.css': 'text/css',
          '.js': 'application/javascript'
        }[ext] || 'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        fs.createReadStream(publicPath).pipe(res);
        return;
      }
    }
    
    await nextHandler(req, res);
  } catch (err) {
    console.error('HTTPS Server Error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// 6. Start listening on HTTPS port
const PORT = 8443;
server.listen(PORT, () => {
  console.log(`> HTTPS Server Listening on https://localhost:${PORT}`);
  console.log(`> Using distDir: dist`);
  console.log(`> SSL certificates: key.pem, cert.pem`);
});
