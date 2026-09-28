const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
puppeteer.use(StealthPlugin());

(async () => {
  const outDir = path.join(__dirname, 'public', 'seats');

  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 1000 } });
  const page = await browser.newPage();
  
  await page.goto('https://www.thespacecinema.it/', { waitUntil: 'networkidle2' });
  
  try {
    await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 3000 });
    await page.click('#onetrust-accept-btn-handler');
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {}

  const data = await page.evaluate(async () => {
    const res = await fetch('https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true');
    return await res.json();
  });
  
  // Collect all sessions per screen
  const screens = {};
  data.result.forEach(movie => {
    movie.showingGroups.forEach(group => {
      group.sessions.forEach(session => {
        if (session.isBookingAvailable && session.bookingUrl) {
          if (!screens[session.screenName]) {
             screens[session.screenName] = [];
          }
          screens[session.screenName].push(session);
        }
      });
    });
  });

  // Pick the session that is furthest in the future to minimize occupied seats
  const targetUrls = {};
  for (const [screenName, sessions] of Object.entries(screens)) {
     // Sort by startTime descending
     sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
     targetUrls[screenName] = sessions[0].bookingUrl;
  }

  for (const [screenName, url] of Object.entries(targetUrls)) {
    console.log(`Scraping ${screenName} at ${url}...`);
    try {
      await page.goto('https://www.thespacecinema.it' + url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 4000)); 
      
      const safeName = screenName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      // Also inject a small CSS snippet to ensure any remaining occupied seats (grey) look like empty standard seats (blue outline) just in case!
      await page.addStyleTag({
         content: `
           svg [fill="#D8D8D8"] {
              fill: white !important;
              stroke: #4567A8 !important; /* Blu */
              stroke-width: 1px !important;
           }
           svg [fill="#999999"] {
              fill: white !important;
              stroke: #4567A8 !important;
              stroke-width: 1px !important;
           }
         `
      });

      await page.screenshot({ 
        path: path.join(outDir, `${safeName}.png`),
        clip: { x: 20, y: 350, width: 750, height: 600 }
      });
      console.log('Saved', safeName);
    } catch (e) {
      console.log('Failed', screenName, e.message);
    }
  }
  
  await browser.close();
})();
