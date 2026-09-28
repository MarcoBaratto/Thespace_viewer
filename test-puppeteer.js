const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  console.log('Navigating to homepage...');
  await page.goto('https://www.thespacecinema.it/', { waitUntil: 'networkidle2' });
  
  const data = await page.evaluate(async () => {
    const res = await fetch('https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true');
    return await res.json();
  });
  
  const url = data.result[0].showingGroups[0].sessions[0].bookingUrl;
  console.log('Navigating to ' + url);

  await page.goto('https://www.thespacecinema.it' + url, { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'test_step2.png' });
  console.log('Screenshot saved as test_step2.png');
  
  // Try to click Intero + button if exists
  try {
     // Wait, the ticket type list usually has buttons with class containing "add" or "plus"
     // Let's just click the first button with a plus sign, or specific test selector
     // We will first take the screenshot to analyze the DOM
  } catch(e) {}
  
  await browser.close();
})();
