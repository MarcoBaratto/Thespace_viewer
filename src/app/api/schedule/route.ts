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
    
    const sessionId = Math.floor(Math.random() * 10000);

    const getProxyUrl = (targetUrl: string, useAntibot: boolean = true) => {
      const apiKey = process.env.ZENROWS_API_KEY;
      if (apiKey) {
        // We use custom_headers=true so ZenRows forwards our Cookie and User-Agent.
        // We use node:https (fetchHttps) to avoid Next.js fetch polyfill injecting tracking headers.
        return `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}&session_id=${sessionId}${useAntibot ? '&antibot=true' : ''}&custom_headers=true`;
      }
      return targetUrl;
    };

    // Helper to bypass Next.js patched fetch
    const fetchHttps = (urlStr: string, headers: Record<string, string> = {}): Promise<{ status: number, data: string, headers: any }> => {
      return new Promise((resolve, reject) => {
        https.get(urlStr, { headers }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            data
          }));
        }).on('error', reject);
      });
    };

    const defaultUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // 1. Fetch the homepage to get the required session cookies
    const homeResponse = await fetchHttps(getProxyUrl('https://www.thespacecinema.it/', true), {
      'User-Agent': defaultUA,
    });

    let cookies = '';
    const setCookieHeader = homeResponse.headers['set-cookie'];
    if (setCookieHeader && Array.isArray(setCookieHeader)) {
      cookies = setCookieHeader.map((c: string) => c.split(';')[0]).join('; ');
    }

    // 2. Fetch the actual API endpoint
    const apiUrl = `https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true`;
    
    const apiHeaders: Record<string, string> = {
      'User-Agent': defaultUA,
      'Accept': 'application/json',
    };
    if (cookies) {
      apiHeaders['Cookie'] = cookies;
    }

    // Using antibot=true for the API as well to share the same session/proxy IP seamlessly
    const apiResponse = await fetchHttps(getProxyUrl(apiUrl, true), apiHeaders);

    if (apiResponse.status !== 200) {
      return NextResponse.json(
        { error: `API responded with status ${apiResponse.status}`, raw: apiResponse.data.substring(0, 500) },
        { status: apiResponse.status === 422 ? 502 : apiResponse.status }
      );
    }

    let data;
    try {
      data = JSON.parse(apiResponse.data);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'API did not return valid JSON', raw_text: apiResponse.data.substring(0, 500) },
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
