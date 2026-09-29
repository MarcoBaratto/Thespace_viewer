const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/ZENROWS_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function fetchHttps(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        data
      }));
    }).on('error', reject);
  });
}

async function run() {
  if (!apiKey) {
    console.log("No API Key");
    return;
  }
  
  const sessionId = Math.floor(Math.random() * 10000);
  
  console.log("Fetching home...");
  const homeUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent('https://www.thespacecinema.it/')}&session_id=${sessionId}&antibot=true`;
  const homeRes = await fetchHttps(homeUrl, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  
  console.log("Home status:", homeRes.status);
  
  const setCookieHeader = homeRes.headers['set-cookie'] || [];
  const cookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');
  console.log("Cookies:", cookies);
  
  console.log("Fetching API with custom_headers=true...");
  const apiUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent('https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true')}&session_id=${sessionId}&antibot=true&custom_headers=true`;
  
  const apiRes = await fetchHttps(apiUrl, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Cookie': cookies
  });
  
  console.log("API status:", apiRes.status);
  console.log("API response:", apiRes.data.substring(0, 200));
}

run();
