import { NextRequest, NextResponse } from 'next/server';

// Proxy API route to handle CORS and rate limiting for market data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // Alpha Vantage API configuration
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    
    if (API_KEY === 'demo') {
      console.warn('⚠️ Using demo API key - limited to 5 calls per minute');
    } else {
      console.log('✅ Using production API key for market data');
    }
    const API_URL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

    console.log(`📊 Fetching market data for ${symbol}...`);

    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'AjoPay-Market-Dashboard/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Check for API errors
    if (data['Error Message']) {
      return NextResponse.json({ error: data['Error Message'] }, { status: 400 });
    }
    
    if (data['Note']) {
      return NextResponse.json({ error: 'API rate limit exceeded', note: data['Note'] }, { status: 429 });
    }

    // Return the market data
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Market data API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
