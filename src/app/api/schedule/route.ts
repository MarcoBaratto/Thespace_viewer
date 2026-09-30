import { NextResponse } from 'next/server';
import * as https from 'https';

let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  
  // Use today's date if not provided
  const targetDate = dateParam || new Date().toISOString().split('T')[0];

  const now = Date.now();
  const isDev = process.env.NODE_ENV === 'development';

  // Check in-memory cache if not in development
  if (!isDev && cachedData && (now - cacheTimestamp < CACHE_DURATION)) {
    console.log('Serving schedule from cache');
    return NextResponse.json(cachedData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      }
    });
  }

  try {
    console.log('Fetching fresh schedule from API...');
    
    const apiKey = process.env.ZENROWS_API_KEY;
    if (!apiKey) {
      throw new Error('ZENROWS_API_KEY is not configured');
    }

    const apiUrl = `https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true`;
    
    // We instruct ZenRows to bypass Cloudflare on the homepage, and then run this Javascript 
    // INSIDE the authenticated browser context to fetch the API and inject it into the DOM.
    const jsInstructions = [
      { wait: 3000 },
      { evaluate: `fetch('${apiUrl}').then(r=>r.text()).then(t=>{ document.body.innerHTML = '<div id="api-data">' + t + '</div>'; }).catch(e=>{ document.body.innerHTML = '<div id="api-data">error</div>'; })` },
      { wait_for: "#api-data" }
    ];

    const proxyUrl = `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent('https://www.thespacecinema.it/')}&js_render=true&premium_proxy=true&antibot=true&js_instructions=${encodeURIComponent(JSON.stringify(jsInstructions))}`;

    // Helper to bypass Next.js patched fetch
    const fetchHttps = (urlStr: string): Promise<{ status: number, data: string }> => {
      return new Promise((resolve, reject) => {
        https.get(urlStr, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({
            status: res.statusCode || 500,
            data
          }));
        }).on('error', reject);
      });
    };

    const response = await fetchHttps(proxyUrl);

    if (response.status !== 200) {
      return NextResponse.json(
        { error: `ZenRows responded with status ${response.status}`, raw: response.data.substring(0, 500) },
        { status: response.status === 422 ? 502 : response.status }
      );
    }

    const match = response.data.match(/<div id="api-data">([\s\S]*?)<\/div>/);
    if (!match || match[1] === 'error') {
      return NextResponse.json(
        { error: 'Failed to extract JSON from ZenRows browser context', raw: response.data.substring(0, 500) },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(match[1]);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'API did not return valid JSON', raw_text: match[1].substring(0, 500) },
        { status: 502 }
      );
    }

    // Update cache if not in development
    if (!isDev) {
      cachedData = data;
      cacheTimestamp = now;
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': isDev 
          ? 'no-store, max-age=0' 
          : 'public, s-maxage=3600, stale-while-revalidate=7200',
      }
    });
  } catch (error: any) {
    console.error('Error fetching cinema schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cinema schedule', details: error.message },
      { status: 500 }
    );
  }
}
