const https = require('https');
const fs = require('fs');
const apiKey = fs.readFileSync('zenrow_key.txt', 'utf8').trim();

const fetchHttps = (urlStr, headers = {}) => {
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
};

async function run() {
  const jsInstructions = [
    { wait: 3000 },
    { evaluate: "fetch('/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true').then(r=>r.text()).then(t=>{ document.body.innerHTML = '<div id=\"api-data\">' + t + '</div>'; }).catch(e=>{ document.body.innerHTML = '<div id=\"api-data\">error</div>'; })" },
    { wait_for: "#api-data" }
  ];

  const proxyUrl = 'https://api.zenrows.com/v1/?apikey=' + apiKey 
    + '&url=' + encodeURIComponent('https://www.thespacecinema.it/') 
    + '&js_render=true&premium_proxy=true&antibot=true'
    + '&js_instructions=' + encodeURIComponent(JSON.stringify(jsInstructions));

  console.log('Fetching homepage with js_instructions...');
  const res = await fetchHttps(proxyUrl);
  
  console.log('Status:', res.status);
  
  const match = res.data.match(/<div id="api-data">([\s\S]*?)<\/div>/);
  if (match) {
     console.log('Extracted Data:', match[1].substring(0, 500));
  } else {
     console.log('Failed to extract. HTML:', res.data.substring(0, 500));
  }
}

run();
