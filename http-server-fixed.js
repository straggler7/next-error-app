const http = require('http');
const path = require('path');
const fs = require('fs');

// 1. Load the NextServer class from the standalone node_modules
const NextServer = require('./.next/standalone/node_modules/next/dist/server/next-server').default;

// 2. Load the build configuration
const configPath = path.join(__dirname, '.next/standalone/.next/required-server-files.json');
const requiredConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 3. Initialize the Next.js handler with correct paths
const nextHandler = new NextServer({
  hostname: '0.0.0.0',
  port: 8443,
  dir: path.join(__dirname, '.next/standalone'),
  dev: false,
  conf: requiredConfig.config,
  customServer: true,
}).getRequestHandler();

// 4. Create the standard Node.js HTTP server
const server = http.createServer(async (req, res) => {
  try {
    // Handle static files manually if needed
    if (req.url.startsWith('/_next/static/')) {
      const staticPath = path.join(__dirname, '.next/standalone/.next/static', req.url.replace('/_next/static', ''));
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
    
    await nextHandler(req, res);
  } catch (err) {
    console.error('Next.js Handler Error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// 5. Start listening on your specific port
const PORT = 8443;
server.listen(PORT, () => {
  console.log(`> Custom Wrapper Listening on http://localhost:${PORT}`);
});
