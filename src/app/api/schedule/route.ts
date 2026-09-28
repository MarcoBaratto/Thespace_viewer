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
    // 1. Fetch the homepage to get the required session cookies
    const homeResponse = await fetch('https://www.thespacecinema.it/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const setCookieHeader = homeResponse.headers.getSetCookie();
    // Combine cookies into a single string for the Cookie header
    const cookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');

    // 2. Fetch the actual API endpoint (without showingDate to get ALL days)
    const apiUrl = `https://www.thespacecinema.it/api/microservice/showings/cinemas/1016/films?minEmbargoLevel=3&includesSession=true&includeSessionAttributes=true`;
    
    const apiResponse = await fetch(apiUrl, {
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

    const data = await apiResponse.json();

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
