const http = require('http');
// const path = require('path');
// const fs = require('fs');

const { createServer } = require('./server.js');

http.createServer(createServer).listen(8443, () => {
    console.log('Server running on port 8443');
});