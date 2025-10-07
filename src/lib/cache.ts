// Redis-like caching layer for high-performance operations
// This implements an in-memory cache that can be easily replaced with Redis

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 300) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL) * 1000;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired,
      hitRate: this.calculateHitRate()
    };
  }

  private hitRate = { hits: 0, misses: 0 };
  
  private calculateHitRate(): number {
    const total = this.hitRate.hits + this.hitRate.misses;
    return total > 0 ? (this.hitRate.hits / total) * 100 : 0;
  }
}

// Global cache instance
const cache = new MemoryCache(1000, 300); // 1000 entries, 5 minute TTL

// Cache key generators
export const CacheKeys = {
  userCommissionSummary: (userId: string) => `commission_summary:${userId}`,
  userCheckinStatus: (userId: string, date: string) => `checkin:${userId}:${date}`,
  commissionTypes: 'commission_types:all',
  userStreak: (userId: string) => `streak:${userId}`,
  userReferrals: (userId: string) => `referrals:${userId}`,
  userPayouts: (userId: string) => `payouts:${userId}`,
  commissionStats: 'commission_stats:global'
};

// Cache wrapper functions
export class CacheManager {
  // Get with fallback
  static async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    const value = await fallback();
    cache.set(key, value, ttl);
    return value;
  }

  // Invalidate user-specific cache
  static invalidateUser(userId: string): void {
    const patterns = [
      CacheKeys.userCommissionSummary(userId),
      CacheKeys.userStreak(userId),
      CacheKeys.userReferrals(userId),
      CacheKeys.userPayouts(userId)
    ];
    
    patterns.forEach(pattern => {
      cache.delete(pattern);
    });
  }

  // Invalidate specific cache entry
  static invalidate(key: string): void {
    cache.delete(key);
  }

  // Set cache entry
  static set<T>(key: string, value: T, ttl?: number): void {
    cache.set(key, value, ttl);
  }

  // Get cache entry
  static get<T>(key: string): T | null {
    return cache.get<T>(key);
  }

  // Check if key exists
  static has(key: string): boolean {
    return cache.has(key);
  }

  // Get cache statistics
  static getStats() {
    return cache.getStats();
  }

  // Clear all cache
  static clear(): void {
    cache.clear();
  }
}

// High-performance commission data fetcher with caching
export class CommissionDataFetcher {
  constructor(private supabase: any) {}

  // Get user commission summary with caching
  async getUserCommissionSummary(userId: string) {
    const cacheKey = CacheKeys.userCommissionSummary(userId);
    
    return CacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await this.supabase
          .rpc('get_user_commission_summary', { p_user_id: userId });
        
        if (error) throw error;
        return data;
      },
      300 // 5 minute cache
    );
  }

  // Get commission types with caching
  async getCommissionTypes() {
    const cacheKey = CacheKeys.commissionTypes;
    
    return CacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await this.supabase
          .from('commission_types')
          .select('*')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        return data;
      },
      3600 // 1 hour cache
    );
  }

  // Get user check-in status with caching
  async getUserCheckinStatus(userId: string, date: string) {
    const cacheKey = CacheKeys.userCheckinStatus(userId, date);
    
    return CacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await this.supabase
          .from('user_checkins')
          .select('*')
          .eq('user_id', userId)
          .eq('checkin_date', date)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
      },
      60 // 1 minute cache
    );
  }

  // Get user streak with caching
  async getUserStreak(userId: string) {
    const cacheKey = CacheKeys.userStreak(userId);
    
    return CacheManager.getOrSet(
      cacheKey,
      async () => {
        const { data, error } = await this.supabase
          .from('user_checkins')
          .select('streak_count')
          .eq('user_id', userId)
          .order('checkin_date', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data?.streak_count || 0;
      },
      300 // 5 minute cache
    );
  }
}

// Performance monitoring for cache operations
export class CachePerformanceMonitor {
  private static metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };

  static recordHit() {
    this.metrics.hits++;
  }

  static recordMiss() {
    this.metrics.misses++;
  }

  static recordSet() {
    this.metrics.sets++;
  }

  static recordDelete() {
    this.metrics.deletes++;
  }

  static getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? (this.metrics.hits / total) * 100 : 0,
      total: total
    };
  }

  static reset() {
    this.metrics = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }
}

// Export the cache manager as default
export default CacheManager;
