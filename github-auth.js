// GitHub Device Flow Authentication + Create Repo + Push
const https = require('https');

const CLIENT_ID = 'Ov23li9GQmCrHxm5UH1v'; // GitHub CLI public client ID

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, headers: res.headers, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Step 1: Start device flow
  console.log('Starting GitHub Device Flow...');
  const startRes = await request({
    hostname: 'github.com',
    path: '/login/device/code',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  }, JSON.stringify({ client_id: CLIENT_ID, scope: 'repo' }));
  
  console.log('DEVICE_CODE:', JSON.stringify(startRes.data));
  
  if (!startRes.data.device_code) {
    console.error('Failed to get device code:', startRes.data);
    process.exit(1);
  }
  
  console.log('\n========================================');
  console.log('📱 请在浏览器中打开: ' + startRes.data.verification_uri);
  console.log('🔑 输入代码: ' + startRes.data.user_code);
  console.log('========================================\n');
  
  // Step 2: Poll for token
  const interval = startRes.data.interval || 5;
  const expiresIn = startRes.data.expires_in || 900;
  const startTime = Date.now();
  
  while (Date.now() - startTime < expiresIn * 1000) {
    await new Promise(r => setTimeout(r, interval * 1000));
    
    const tokenRes = await request({
      hostname: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    }, JSON.stringify({
      client_id: CLIENT_ID,
      device_code: startRes.data.device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
    }));
    
    if (tokenRes.data.access_token) {
      console.log('✅ Token obtained!');
      console.log('TOKEN:' + tokenRes.data.access_token);
      return tokenRes.data.access_token;
    }
    
    if (tokenRes.data.error === 'authorization_pending') {
      process.stdout.write('.');
      continue;
    }
    
    if (tokenRes.data.error === 'slow_down') {
      await new Promise(r => setTimeout(r, 5 * 1000));
      continue;
    }
    
    if (tokenRes.data.error === 'expired_token') {
      console.error('Device code expired');
      process.exit(1);
    }
    
    console.error('Unexpected response:', tokenRes.data);
    process.exit(1);
  }
  
  console.error('Timeout waiting for authorization');
  process.exit(1);
}

main();
