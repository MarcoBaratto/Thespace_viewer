const apiKey = process.env.ZENROWS_API_KEY;
const apiUrl = 'https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true';
const proxyUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(apiUrl)}&antibot=true`;

async function run() {
  console.log('Fetching API directly with antibot=true...');
  const res = await fetch(proxyUrl);
  console.log('API Status:', res.status);
  console.log('API Data snippet:', (await res.text()).substring(0, 200));
}
run();
