import { NextResponse } from 'next/server';

let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  }

  try {
    console.log('Fetching fresh schedule from API...');
    
    console.log('Fetching fresh schedule from API...');
    
    // Generate a random session ID to keep the ZenRows IP the same for both requests
    const sessionId = Math.floor(Math.random() * 1000000);

    const getProxyUrl = (targetUrl: string) => {
      const apiKey = process.env.ZENROWS_API_KEY;
      if (apiKey) {
        // We use session_id so ZenRows uses the SAME IP for the cookie request and the API request.
        // We do NOT use premium_proxy because it requires a paid plan and causes a 400 Bad Request.
        return `https://api.zenrows.com/v1/?apikey=${apiKey}&url=${encodeURIComponent(targetUrl)}&custom_headers=true&session_id=${sessionId}`;
      }
      return targetUrl;
    };

    // 1. Fetch the homepage to get the required session cookies
    const homeResponse = await fetch(getProxyUrl('https://www.thespacecinema.it/'), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const setCookieHeader = homeResponse.headers.getSetCookie();
    const cookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');

    // 2. Fetch the actual API endpoint
    const apiUrl = `https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true`;
    
    const apiResponse = await fetch(getProxyUrl(apiUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': cookies,
        'Accept': 'application/json',
      },
    });

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `API responded with status ${apiResponse.status}` },
        { status: apiResponse.status }
      );
    }

    let data;
    try {
      const rawText = await apiResponse.text();
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        return NextResponse.json(
          { error: 'API did not return valid JSON', raw_text: rawText.substring(0, 500) },
          { status: 502 }
        );
      }
    } catch (e) {
      return NextResponse.json({ error: 'Failed to read response body' }, { status: 500 });
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
          : 'public, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('Error fetching cinema schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cinema schedule' },
      { status: 500 }
    );
  }
}
