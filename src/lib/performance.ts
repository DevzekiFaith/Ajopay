// Performance optimization utilities for 250k+ users

// Database connection pooling configuration
export const DB_CONFIG = {
  // Supabase connection pool settings
  poolSize: 20,
  maxConnections: 100,
  connectionTimeout: 30000,
  idleTimeout: 60000,
  
  // Query optimization
  queryTimeout: 10000,
  maxQuerySize: 1000,
  
  // Caching settings
  cacheTTL: 300, // 5 minutes
  maxCacheSize: 1000
};

// API rate limiting configuration
export const RATE_LIMITS = {
  // Per user limits
  user: {
    dailyCheckin: 1, // Once per day
    commissionList: 100, // 100 requests per hour
    withdrawal: 5, // 5 withdrawals per day
    general: 1000 // 1000 requests per hour
  },
  
  // Global limits
  global: {
    commissionList: 10000, // 10k requests per hour
    dailyCheckin: 50000, // 50k check-ins per hour
    withdrawal: 1000 // 1k withdrawals per hour
  }
};

// Caching strategy for high-traffic endpoints
export const CACHE_KEYS = {
  userCommissionSummary: (userId: string) => `commission_summary:${userId}`,
  userCheckinStatus: (userId: string, date: string) => `checkin:${userId}:${date}`,
  commissionTypes: 'commission_types:all',
  userStreak: (userId: string) => `streak:${userId}`,
  userReferrals: (userId: string) => `referrals:${userId}`
};

// Database query optimization helpers
export class QueryOptimizer {
  // Batch operations for better performance
  static async batchInsert<T>(
    supabase: any,
    table: string,
    records: T[],
    batchSize: number = 100
  ) {
    const results = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from(table)
        .insert(batch);
      
      if (error) throw error;
      results.push(data);
    }
    
    return results.flat();
  }
  
  // Optimized pagination
  static buildPaginationQuery(
    baseQuery: any,
    page: number = 1,
    limit: number = 50,
    orderBy: string = 'created_at',
    orderDirection: 'asc' | 'desc' = 'desc'
  ) {
    const offset = (page - 1) * limit;
    
    return baseQuery
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1);
  }
  
  // Efficient counting with approximate results for large datasets
  static async getApproximateCount(
    supabase: any,
    table: string
  ) {
    // For tables with 250k+ records, use approximate counting
    const { data, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });
    
    if (error) throw error;
    return data?.length || 0;
  }
}

// Memory-efficient data processing
export class DataProcessor {
  // Process large datasets in chunks
  static async processInChunks<T, R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number = 1000
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // Allow event loop to process other tasks
      await new Promise(resolve => setImmediate(resolve));
    }
    
    return results;
  }
  
  // Efficient data aggregation
  static aggregateCommissions(commissions: any[]) {
    return commissions.reduce((acc, commission) => {
      const type = commission.commission_type || commission.type_code;
      acc.totalEarned += commission.amount_kobo;
      acc.byType[type] = (acc.byType[type] || 0) + commission.amount_kobo;
      
      if (commission.status === 'paid') {
        acc.totalPaid += commission.amount_kobo;
      } else if (commission.status === 'pending') {
        acc.totalPending += commission.amount_kobo;
      }
      
      return acc;
    }, {
      totalEarned: 0,
      totalPaid: 0,
      totalPending: 0,
      byType: {} as Record<string, number>
    });
  }
}

// Background job processing for heavy operations
export class BackgroundProcessor {
  private static jobs: Map<string, Promise<any>> = new Map();
  
  // Process commission calculations in background
  static async processCommissionSummary(userId: string) {
    const jobKey = `commission_summary:${userId}`;
    
    if (this.jobs.has(jobKey)) {
      return this.jobs.get(jobKey);
    }
    
    const job = this.calculateCommissionSummary();
    this.jobs.set(jobKey, job);
    
    // Clean up completed jobs
    job.finally(() => {
      this.jobs.delete(jobKey);
    });
    
    return job;
  }
  
  private static async calculateCommissionSummary() {
    // This would be implemented with actual database queries
    // For now, return a placeholder
    return {
      totalEarned: 0,
      totalPaid: 0,
      totalPending: 0,
      byType: {}
    };
  }
}

// Monitoring and alerting for performance
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  
  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }
  
  static getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  static getMetricStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

// Database index recommendations for 250k+ users
export const RECOMMENDED_INDEXES = [
  // User commissions indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commissions_user_status ON user_commissions(user_id, status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commissions_created_at ON user_commissions(created_at DESC);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commissions_type_status ON user_commissions(commission_type_id, status);',
  
  // User checkins indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_checkins_user_date ON user_checkins(user_id, checkin_date DESC);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_checkins_date ON user_checkins(checkin_date);',
  
  // Commission payouts indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commission_payouts_user_status ON commission_payouts(user_id, status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commission_payouts_created_at ON commission_payouts(created_at DESC);',
  
  // User referrals indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_referrals_referrer_status ON user_referrals(referrer_id, status);',
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);',
  
  // Commission summary indexes
  'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commission_summary_updated ON user_commission_summary(last_updated DESC);'
];

// Query optimization tips
export const QUERY_OPTIMIZATION_TIPS = {
  // Use specific column selection instead of SELECT *
  selectSpecificColumns: true,
  
  // Use LIMIT for large result sets
  useLimit: true,
  defaultLimit: 50,
  maxLimit: 1000,
  
  // Use proper indexing
  useIndexes: true,
  
  // Batch operations when possible
  batchOperations: true,
  batchSize: 100,
  
  // Use database functions for complex operations
  useDatabaseFunctions: true,
  
  // Implement proper pagination
  useCursorPagination: true,
  
  // Cache frequently accessed data
  useCaching: true,
  cacheTTL: 300
};


