const http = require('http');
const path = require('path');
const fs = require('fs');

// 1. Load the NextServer class from the standalone node_modules
const NextServer = require('./.next/standalone/node_modules/next/dist/server/next-server').default;

// 2. Load the build configuration
const configPath = path.join(__dirname, '.next/required-server-files.json');
const requiredConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 3. Initialize the Next.js handler
const nextHandler = new NextServer({
  hostname: '0.0.0.0',
  port: 8443,
  dir: __dirname,
  dev: false,
  conf: requiredConfig.config,
  customServer: true,
}).getRequestHandler();

// 4. Create the standard Node.js HTTP server
const server = http.createServer(async (req, res) => {
  try {
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