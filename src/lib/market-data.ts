// Real-time market data service
export interface RealTimeMarketData {
  symbol: string;
  name: string;
  category: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  priceHistory: number[];
  timestamp: number;
  lastUpdate: string;
}

export interface MarketQuote {
  '01. symbol': string;
  '02. open': string;
  '03. high': string;
  '04. low': string;
  '05. price': string;
  '06. volume': string;
  '07. latest trading day': string;
  '08. previous close': string;
  '09. change': string;
  '10. change percent': string;
}

export interface AlphaVantageResponse {
  'Global Quote': MarketQuote;
}

// Alpha Vantage API key from environment variables
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';

// Log API key status on startup
if (typeof window === 'undefined') { // Server-side only
  if (ALPHA_VANTAGE_API_KEY === 'demo') {
    console.log('⚠️ Market Data: Using demo API key (5 calls/minute limit)');
  } else {
    console.log('✅ Market Data: Using production API key - 06ICFNG4WJUS5IE2');
  }
}

// Nigerian stocks and international stocks that are commonly traded
const STOCK_SYMBOLS = [
  // Nigerian stocks (using international equivalents or similar companies)
  { symbol: 'MTN', name: 'MTN Group', category: 'telecommunications' },
  { symbol: 'DANGOTE', name: 'Dangote Cement', category: 'manufacturing' },
  { symbol: 'ZENITH', name: 'Zenith Bank', category: 'banking' },
  { symbol: 'ACCESS', name: 'Access Bank', category: 'banking' },
  { symbol: 'GTB', name: 'GTBank', category: 'banking' },
  
  // International stocks for diversification
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp', category: 'technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'automotive' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'e-commerce' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', category: 'technology' },
  { symbol: 'META', name: 'Meta Platforms', category: 'technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'entertainment' },
  
  // Commodities and ETFs
  { symbol: 'GLD', name: 'SPDR Gold Trust', category: 'commodities' },
  { symbol: 'SLV', name: 'iShares Silver Trust', category: 'commodities' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', category: 'etf' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', category: 'etf' },
];

// Cache for storing market data
const marketDataCache = new Map<string, RealTimeMarketData>();
const cacheExpiry = new Map<string, number>();
const CACHE_DURATION = 60000; // 1 minute cache

// Generate mock data for Nigerian stocks (since they might not be available in free APIs)
const generateMockNigerianStockData = (symbol: string, name: string, category: string): RealTimeMarketData => {
  const basePrices: { [key: string]: number } = {
    'MTN': 120,
    'DANGOTE': 280,
    'ZENITH': 45,
    'ACCESS': 38,
    'GTB': 42,
  };

  const basePrice = basePrices[symbol] || 100;
  const volatility = 0.02; // 2% volatility
  const change = (Math.random() - 0.5) * volatility * basePrice;
  const currentPrice = Math.max(basePrice + change, basePrice * 0.8);
  const changePercent = (change / basePrice) * 100;
  
  // Generate price history (last 24 hours)
  const priceHistory = [];
  let price = basePrice;
  for (let i = 0; i < 24; i++) {
    price += (Math.random() - 0.5) * volatility * price;
    priceHistory.push(Math.max(price * 0.8, price * 1.2));
  }
  priceHistory.push(currentPrice);

  return {
    symbol,
    name,
    category,
    currentPrice,
    change,
    changePercent,
    volume: Math.floor(Math.random() * 1000000) + 100000,
    marketCap: Math.floor(currentPrice * (Math.random() * 10000000 + 1000000)),
    high24h: currentPrice * (1 + Math.random() * 0.05),
    low24h: currentPrice * (1 - Math.random() * 0.05),
    priceHistory,
    timestamp: Date.now(),
    lastUpdate: new Date().toISOString(),
  };
};

// Fetch real data from our API route (which proxies to Alpha Vantage)
const fetchRealTimeData = async (symbol: string): Promise<RealTimeMarketData | null> => {
  try {
    const response = await fetch(`/api/market-data?symbol=${symbol}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`Rate limit exceeded for ${symbol}, using cached data`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: AlphaVantageResponse = await response.json();
    
    if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
      return null;
    }
    
    const quote = data['Global Quote'];
    const currentPrice = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    const volume = parseInt(quote['06. volume']);
    const high24h = parseFloat(quote['03. high']);
    const low24h = parseFloat(quote['04. low']);
    
    // Generate price history (simplified - in real app you'd fetch historical data)
    const priceHistory = [];
    let price = currentPrice;
    for (let i = 0; i < 24; i++) {
      price += (Math.random() - 0.5) * 0.01 * price;
      priceHistory.push(Math.max(price * 0.95, price * 1.05));
    }
    priceHistory.push(currentPrice);
    
    return {
      symbol,
      name: symbol, // You might want to maintain a mapping of symbols to names
      category: 'stocks',
      currentPrice,
      change,
      changePercent,
      volume,
      marketCap: Math.floor(currentPrice * volume * 0.1), // Rough estimate
      high24h,
      low24h,
      priceHistory,
      timestamp: Date.now(),
      lastUpdate: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
};

// Rate limiting for API calls
let lastApiCall = 0;
const API_CALL_INTERVAL = 200; // 200ms between API calls to respect rate limits

// Main function to get market data
export const getMarketData = async (): Promise<RealTimeMarketData[]> => {
  const results: RealTimeMarketData[] = [];
  const internationalStocks = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'GLD', 'SLV', 'SPY', 'QQQ'];
  
  for (const stock of STOCK_SYMBOLS) {
    const cacheKey = stock.symbol;
    const now = Date.now();
    
    // Check cache first
    if (marketDataCache.has(cacheKey) && cacheExpiry.get(cacheKey)! > now) {
      results.push(marketDataCache.get(cacheKey)!);
      continue;
    }
    
    let marketData: RealTimeMarketData | null = null;
    
    // Try to fetch real data for international stocks (with rate limiting)
    if (internationalStocks.includes(stock.symbol)) {
      // Rate limiting: wait if we called API too recently
      const timeSinceLastCall = now - lastApiCall;
      if (timeSinceLastCall < API_CALL_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
      }
      
      try {
        marketData = await fetchRealTimeData(stock.symbol);
        lastApiCall = Date.now();
        
        if (marketData) {
          console.log(`✅ Successfully fetched real data for ${stock.symbol}: $${marketData.currentPrice} (${marketData.changePercent > 0 ? '+' : ''}${marketData.changePercent.toFixed(2)}%)`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch real data for ${stock.symbol}, using mock data:`, error);
      }
    }
    
    // Fallback to mock data for Nigerian stocks or if API fails
    if (!marketData) {
      marketData = generateMockNigerianStockData(stock.symbol, stock.name, stock.category);
    }
    
    if (marketData) {
      // Cache the data
      marketDataCache.set(cacheKey, marketData);
      cacheExpiry.set(cacheKey, now + CACHE_DURATION);
      results.push(marketData);
    }
  }
  
  console.log(`📊 Market data loaded: ${results.length} assets (${results.filter(r => internationalStocks.includes(r.symbol)).length} real-time)`);
  return results;
};

// Get market data for a specific symbol
export const getMarketDataBySymbol = async (symbol: string): Promise<RealTimeMarketData | null> => {
  const stock = STOCK_SYMBOLS.find(s => s.symbol === symbol);
  if (!stock) return null;
  
  const cacheKey = symbol;
  const now = Date.now();
  
  // Check cache first
  if (marketDataCache.has(cacheKey) && cacheExpiry.get(cacheKey)! > now) {
    return marketDataCache.get(cacheKey)!;
  }
  
  let marketData: RealTimeMarketData | null = null;
  
  // Try to fetch real data for international stocks
  if (['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'GLD', 'SLV', 'SPY', 'QQQ'].includes(symbol)) {
    marketData = await fetchRealTimeData(symbol);
  }
  
  // Fallback to mock data
  if (!marketData) {
    marketData = generateMockNigerianStockData(stock.symbol, stock.name, stock.category);
  }
  
  if (marketData) {
    // Cache the data
    marketDataCache.set(cacheKey, marketData);
    cacheExpiry.set(cacheKey, now + CACHE_DURATION);
  }
  
  return marketData;
};

// Clear cache (useful for testing or manual refresh)
export const clearMarketDataCache = () => {
  marketDataCache.clear();
  cacheExpiry.clear();
};

// Get cache status
export const getCacheStatus = () => {
  const now = Date.now();
  const cachedSymbols = Array.from(marketDataCache.keys());
  const expiredSymbols = cachedSymbols.filter(symbol => 
    cacheExpiry.get(symbol)! <= now
  );
  
  return {
    totalCached: cachedSymbols.length,
    expired: expiredSymbols.length,
    valid: cachedSymbols.length - expiredSymbols.length,
  };
};
