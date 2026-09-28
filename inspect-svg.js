const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1280, height: 1000 } });
  const page = await browser.newPage();
  
  await page.goto('https://www.thespacecinema.it/prenotare-il-biglietto/summary/1016/HO00003549/76742', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  
  const classes = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    // Find the largest SVG (the seat map)
    const seatMap = svgs.sort((a,b) => (b.getBoundingClientRect().width * b.getBoundingClientRect().height) - (a.getBoundingClientRect().width * a.getBoundingClientRect().height))[0];
    
    if (!seatMap) return 'No seatmap';
    
    // get all g/path elements
    const elements = Array.from(seatMap.querySelectorAll('*'));
    
    const fillColors = new Set();
    const classNames = new Set();
    
    elements.forEach(el => {
       if (el.getAttribute('fill')) fillColors.add(el.getAttribute('fill'));
       if (el.className && typeof el.className === 'string') classNames.add(el.className);
       if (el.className && el.className.baseVal) classNames.add(el.className.baseVal);
    });
    
    return {
      width: seatMap.getBoundingClientRect().width,
      colors: Array.from(fillColors),
      classes: Array.from(classNames)
    }
  });
  
  console.log(classes);
  await browser.close();
})();
