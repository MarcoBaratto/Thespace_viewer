const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/ZENROWS_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

async function run() {
  if (!apiKey) {
    console.log("No API Key");
    return;
  }
  
  const sessionId = Math.floor(Math.random() * 10000);
  
  const getProxyUrl = (targetUrl) => {
    return `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}&session_id=${sessionId}&antibot=true`;
  };

  console.log("Fetching home...");
  const homeRes = await fetch(getProxyUrl('https://www.thespacecinema.it/'), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  
  console.log("Home status:", homeRes.status);
  
  const setCookieHeader = homeRes.headers.get('set-cookie') || '';
  const cookies = setCookieHeader.split(', ').map(c => c.split(';')[0]).join('; ');
  console.log("Cookies:", cookies);
  
  console.log("Fetching API...");
  const apiRes = await fetch(getProxyUrl('https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true'), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Cookie': cookies
    }
  });
  
  console.log("API status:", apiRes.status);
  const text = await apiRes.text();
  console.log("API response:", text.substring(0, 200));
}

run();
