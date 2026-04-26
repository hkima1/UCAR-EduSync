const http = require('http');
const { spawn } = require('child_process');

const server = spawn('node', ['server/index.cjs'], { stdio: 'inherit' });

setTimeout(() => {
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.log('\n--- API RESPONSE ---');
      console.log(JSON.stringify(JSON.parse(body), null, 2));
      server.kill();
      process.exit(0);
    });
  });
  req.write(JSON.stringify({ email: 'f.marzouki@ucar.tn', password: 'Admin@2025' }));
  req.end();
}, 2000);
