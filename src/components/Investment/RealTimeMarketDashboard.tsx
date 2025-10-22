"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  PieChart,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Globe,
  Building,
  TreePine,
  Car,
  Home,
  Briefcase,
  Cpu,
  Heart,
  GraduationCap,
  Fuel,
  Wifi,
  WifiOff,
  Gem
} from "lucide-react";
import { getMarketData, getCacheStatus, clearMarketDataCache, type RealTimeMarketData } from "@/lib/market-data";

// Using RealTimeMarketData from market-data service

interface MarketCategory {
  value: string;
  label: string;
  icon: any;
  color: string;
}

const marketCategories: MarketCategory[] = [
  { value: 'all', label: 'All Markets', icon: Globe, color: 'text-blue-500' },
  { value: 'technology', label: 'Technology', icon: Cpu, color: 'text-blue-600' },
  { value: 'banking', label: 'Banking', icon: Building, color: 'text-gray-600' },
  { value: 'telecommunications', label: 'Telecom', icon: Wifi, color: 'text-green-500' },
  { value: 'manufacturing', label: 'Manufacturing', icon: Building, color: 'text-orange-500' },
  { value: 'automotive', label: 'Automotive', icon: Car, color: 'text-red-500' },
  { value: 'e-commerce', label: 'E-commerce', icon: Globe, color: 'text-purple-500' },
  { value: 'entertainment', label: 'Entertainment', icon: Heart, color: 'text-pink-500' },
  { value: 'commodities', label: 'Commodities', icon: Gem, color: 'text-yellow-500' },
  { value: 'etf', label: 'ETFs', icon: BarChart3, color: 'text-indigo-500' }
];

// Real market data service integration

// Enhanced line chart component with animations
const LineChart = ({ data, color = "#3b82f6", height = 60 }: { data: number[], color?: string, height?: number }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const gradientId = `gradient-${color.replace('#', '')}`;

  return (
    <div className="w-full relative" style={{ height }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="50%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${gradientId}`}>
            <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Area under the curve */}
        <polygon
          fill={`url(#${gradientId})`}
          points={`0,100 ${points} 100,100`}
        />
        
        {/* Main line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          points={points}
          filter={`url(#glow-${gradientId})`}
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((value - min) / range) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="0.8"
              fill={color}
              opacity="0.8"
            />
          );
        })}
      </svg>
      
      {/* Price indicator */}
      <div className="absolute top-1 right-1 text-xs font-medium" style={{ color }}>
        {data[data.length - 1]?.toFixed(2)}
      </div>
    </div>
  );
};

export function RealTimeMarketDashboard() {
  const [marketData, setMarketData] = useState<RealTimeMarketData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  const [cacheStatus, setCacheStatus] = useState({ totalCached: 0, expired: 0, valid: 0 });

  const loadMarketData = useCallback(async () => {
    setIsLoading(true);
    setConnectionStatus('loading');
    
    try {
      console.log('🔄 Loading real-time market data...');
      const newData = await getMarketData();
      
      if (newData && newData.length > 0) {
        setMarketData(newData);
        setLastUpdate(new Date());
        setConnectionStatus('connected');
        
        // Update cache status
        const cacheInfo = getCacheStatus();
        setCacheStatus(cacheInfo);
        
        // Only show toast on manual refresh, not auto-refresh
        if (!autoRefresh) {
          const realDataCount = newData.filter(item => 
            ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'GLD', 'SLV', 'SPY', 'QQQ'].includes(item.symbol)
          ).length;
          
          if (realDataCount > 0) {
            toast.success(
              `Market data updated - ${newData.length} assets tracked (${realDataCount} real-time from Alpha Vantage)`
            );
          } else {
            toast.success(
              `Market data updated - ${newData.length} assets tracked (using cached/simulated data)`
            );
          }
        }
      } else {
        setConnectionStatus('disconnected');
        toast.error('No market data available');
      }
    } catch (error) {
      console.error('Error loading market data:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to load market data - using cached data');
      
      // Try to get cached data as fallback
      const cacheInfo = getCacheStatus();
      setCacheStatus(cacheInfo);
    } finally {
      setIsLoading(false);
    }
  }, [autoRefresh]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMarketData();
    }, 60000); // Update every 60 seconds (1 minute)

    return () => clearInterval(interval);
  }, [autoRefresh, loadMarketData]);

  const filteredData = marketData.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const getCategoryIcon = (category: string) => {
    const cat = marketCategories.find(c => c.value === category);
    return cat ? cat.icon : Globe;
  };

  const getCategoryColor = (category: string) => {
    const cat = marketCategories.find(c => c.value === category);
    return cat ? cat.color : 'text-gray-500';
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown;
  };

  const formatPrice = (price: number) => {
    return `₦${price.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000000) return `₦${(marketCap / 1000000000).toFixed(1)}B`;
    if (marketCap >= 1000000) return `₦${(marketCap / 1000000).toFixed(1)}M`;
    return `₦${(marketCap / 1000).toFixed(1)}K`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2">
            <h2 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Real-Time Market Dashboard</h2>
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' && (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi className="h-3 w-3 xs:h-4 xs:w-4" />
                  <span className="text-xs font-medium">Live</span>
                </div>
              )}
              {connectionStatus === 'disconnected' && (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff className="h-3 w-3 xs:h-4 xs:w-4" />
                  <span className="text-xs font-medium">Offline</span>
                </div>
              )}
              {connectionStatus === 'loading' && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <RefreshCw className="h-3 w-3 xs:h-4 xs:w-4 animate-spin" />
                  <span className="text-xs font-medium">Loading</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Live market data and performance analytics • {cacheStatus.valid} cached assets
          </p>
        </div>
        
        {/* Control Buttons - Mobile Optimized */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-xs xs:text-sm"
          >
            {autoRefresh ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            <span className="hidden xs:inline">{autoRefresh ? 'Auto' : 'Manual'}</span>
            <span className="xs:hidden">{autoRefresh ? 'ON' : 'OFF'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMarketData}
            disabled={isLoading}
            className="text-xs xs:text-sm"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
            <span className="xs:hidden">↻</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearMarketDataCache();
              loadMarketData();
              toast.info('Cache cleared and data refreshed');
            }}
            className="text-xs xs:text-sm col-span-2 xs:col-span-1"
          >
            <Zap className="h-3 w-3 mr-1" />
            <span className="hidden xs:inline">Clear Cache</span>
            <span className="xs:hidden">Clear</span>
          </Button>
        </div>
      </div>

      {/* Market Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Active Markets</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">{marketData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Gainers</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-green-600">
                  {marketData.filter(item => item.change > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Losers</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-red-600">
                  {marketData.filter(item => item.change < 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Total Volume</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                  {formatVolume(marketData.reduce((sum, item) => sum + item.volume, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Ticker */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Live Market Ticker</span>
          </div>
          <div className="flex gap-3 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide">
            {marketData.slice(0, 6).map((item) => {
              const ChangeIcon = getChangeIcon(item.change);
              const changeColor = getChangeColor(item.change);
              const isLiveData = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'GLD', 'SLV', 'SPY', 'QQQ'].includes(item.symbol);
              return (
                <div key={item.symbol} className="flex items-center gap-1.5 sm:gap-2 min-w-fit flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{item.symbol}</span>
                    {isLiveData && <Wifi className="h-2 w-2 text-green-500" />}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.currentPrice)}</span>
                  <div className={`flex items-center gap-0.5 sm:gap-1 ${changeColor}`}>
                    <ChangeIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span className="text-xs font-medium">{item.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        {marketCategories.map(category => {
          const Icon = category.icon;
          return (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">{category.label}</span>
              <span className="xs:hidden">{category.label.split(' ')[0]}</span>
            </Button>
          );
        })}
      </div>

      {/* Market Data Table */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4">
                  <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3 sm:mb-4"></div>
                  <div className="h-12 sm:h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredData.map((item) => {
              const Icon = getCategoryIcon(item.category);
              const ChangeIcon = getChangeIcon(item.change);
              const categoryColor = getCategoryColor(item.category);
              const changeColor = getChangeColor(item.change);
              const chartColor = item.change >= 0 ? '#10b981' : '#ef4444';

              return (
                <motion.div
                  key={item.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className={`p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0`}>
                              <Icon className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ${categoryColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
                                <CardTitle className="text-xs sm:text-sm lg:text-base truncate">{item.name}</CardTitle>
                                {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'GLD', 'SLV', 'SPY', 'QQQ'].includes(item.symbol) && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500" />
                                    <span className="text-xs text-green-600 font-medium">Live</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.symbol}</p>
                            </div>
                          </div>
                          <Badge className={`${changeColor} text-xs flex-shrink-0`}>
                            <ChangeIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            {item.changePercent.toFixed(2)}%
                          </Badge>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 pt-0">
                      {/* Price Chart */}
                      <div className="h-12 sm:h-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1.5 sm:p-2">
                        <LineChart data={item.priceHistory} color={chartColor} height={48} />
                      </div>
                      
                      {/* Price Info */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">
                            {formatPrice(item.currentPrice)}
                          </p>
                          <p className={`text-xs sm:text-sm ${changeColor} truncate`}>
                            {item.change >= 0 ? '+' : ''}{formatPrice(item.change)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-600 dark:text-gray-400">24h Range</p>
                          <p className="text-xs font-medium">
                            {formatPrice(item.low24h)} - {formatPrice(item.high24h)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Market Stats */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 truncate">Volume</p>
                          <p className="font-medium truncate">{formatVolume(item.volume)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 truncate">Market Cap</p>
                          <p className="font-medium truncate">{formatMarketCap(item.marketCap)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Last Update Info */}
      <div className="text-center px-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <span className="block xs:inline">Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <span className="hidden xs:inline"> • </span>
          <span className="block xs:inline">Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
          <span className="hidden xs:inline"> • </span>
          <span className="block xs:inline">Updates every 60s</span>
          <span className="hidden xs:inline"> • </span>
          <span className="block xs:inline">Status: {connectionStatus}</span>
        </p>
      </div>
    </div>
  );
}
