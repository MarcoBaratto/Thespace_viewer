const apiKey = process.env.ZENROWS_API_KEY;
const sessionId = Math.floor(Math.random() * 100);
const getProxyUrl = (targetUrl, premium = false, antibot = false) => {
  let url = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}&custom_headers=true&session_id=${sessionId}`;
  if (premium) url += '&premium_proxy=true';
  if (antibot) url += '&antibot=true';
  return url;
};

async function test(name, premium, antibot) {
  console.log(`\n--- Testing ${name} ---`);
  const url = getProxyUrl('https://www.thespacecinema.it/', premium, antibot);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  console.log('Status:', response.status);
  const text = await response.text();
  console.log('Response snippet:', text.substring(0, 150));
}

async function run() {
  await test('Vanilla', false, false);
  await test('Premium Proxy', true, false);
  await test('Antibot', false, true);
  await test('Premium Proxy + Antibot', true, true);
}

run().catch(console.error);
