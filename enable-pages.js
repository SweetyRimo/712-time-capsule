// Enable GitHub Pages via API using SSH-based approach
// We'll use the GitHub REST API to enable Pages
const https = require('https');
const { execSync } = require('child_process');

// Get the SSH fingerprint to check auth
// We need a token - let's try to use git credential
// Actually, let's just guide to enable Pages via web

console.log('Opening GitHub Pages settings...');
const url = 'https://github.com/SweetyRimo/712-time-capsule/settings/pages';

// Try to open browser
try {
  execSync('open "' + url + '"');
  console.log('Opened browser to GitHub Pages settings');
} catch(e) {
  console.log('Please open: ' + url);
}
