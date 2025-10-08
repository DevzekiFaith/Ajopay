#!/usr/bin/env node

// Performance testing script for 250k+ users
// This script simulates high load to test the commission system

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

class PerformanceTester {
  constructor() {
    this.results = {
      commissionList: [],
      dailyCheckin: [],
      databaseQueries: [],
      cacheOperations: []
    };
  }

  async testCommissionListAPI(iterations = 100) {
    console.log(`Testing commission list API with ${iterations} requests...`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < iterations; i++) {
      const promise = this.simulateCommissionListRequest();
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const avgResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const successRate = (results.filter(time => time < 1000).length / results.length) * 100;
    
    console.log(`✅ Commission List API Test Results:`);
    console.log(`   - Total requests: ${iterations}`);
    console.log(`   - Total duration: ${duration}ms`);
    console.log(`   - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   - Success rate: ${successRate.toFixed(2)}%`);
    console.log(`   - Requests per second: ${(iterations / (duration / 1000)).toFixed(2)}`);
    
    this.results.commissionList.push({
      iterations,
      duration,
      avgResponseTime,
      successRate,
      rps: iterations / (duration / 1000)
    });
  }

  async simulateCommissionListRequest() {
    const startTime = Date.now();
    
    try {
      // Simulate the commission list query
      const { data, error } = await supabase
        .from('user_commissions')
        .select(`
          id,
          amount_kobo,
          description,
          status,
          created_at,
          commission_types!inner(name, type_code)
        `)
        .limit(50)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return Date.now() - startTime;
    } catch (error) {
      console.error('Commission list request failed:', error.message);
      return 9999; // Mark as failed
    }
  }

  async testDailyCheckinAPI(iterations = 50) {
    console.log(`Testing daily check-in API with ${iterations} requests...`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < iterations; i++) {
      const promise = this.simulateDailyCheckinRequest();
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const avgResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const successRate = (results.filter(time => time < 2000).length / results.length) * 100;
    
    console.log(`✅ Daily Check-in API Test Results:`);
    console.log(`   - Total requests: ${iterations}`);
    console.log(`   - Total duration: ${duration}ms`);
    console.log(`   - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   - Success rate: ${successRate.toFixed(2)}%`);
    console.log(`   - Requests per second: ${(iterations / (duration / 1000)).toFixed(2)}`);
    
    this.results.dailyCheckin.push({
      iterations,
      duration,
      avgResponseTime,
      successRate,
      rps: iterations / (duration / 1000)
    });
  }

  async simulateDailyCheckinRequest() {
    const startTime = Date.now();
    
    try {
      // Simulate the daily check-in process
      const { data, error } = await supabase
        .rpc('process_daily_checkin', { 
          p_user_id: '00000000-0000-0000-0000-000000000001' // Test user ID
        });
      
      if (error && !error.message.includes('Already checked in')) {
        throw error;
      }
      
      return Date.now() - startTime;
    } catch (error) {
      console.error('Daily check-in request failed:', error.message);
      return 9999; // Mark as failed
    }
  }

  async testDatabasePerformance() {
    console.log('Testing database performance...');
    
    const tests = [
      {
        name: 'Commission Types Query',
        query: () => supabase.from('commission_types').select('*').eq('is_active', true)
      },
      {
        name: 'User Commission Summary',
        query: () => supabase.from('user_commission_summary').select('*').limit(1)
      },
      {
        name: 'User Checkins Query',
        query: () => supabase.from('user_checkins').select('*').limit(100)
      }
    ];
    
    for (const test of tests) {
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const { error } = await test.query();
        const duration = Date.now() - startTime;
        
        if (!error) {
          times.push(duration);
        }
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      console.log(`✅ ${test.name}: ${avgTime.toFixed(2)}ms average`);
      
      this.results.databaseQueries.push({
        name: test.name,
        avgTime,
        iterations: times.length
      });
    }
  }

  async testConcurrentUsers(simulatedUsers = 1000) {
    console.log(`Testing concurrent user simulation with ${simulatedUsers} users...`);
    
    const startTime = Date.now();
    const promises = [];
    
    // Simulate 1000 concurrent users making commission list requests
    for (let i = 0; i < simulatedUsers; i++) {
      const promise = this.simulateCommissionListRequest();
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    const avgResponseTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const successRate = (results.filter(time => time < 1000).length / results.length) * 100;
    
    console.log(`✅ Concurrent Users Test Results:`);
    console.log(`   - Simulated users: ${simulatedUsers}`);
    console.log(`   - Total duration: ${duration}ms`);
    console.log(`   - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   - Success rate: ${successRate.toFixed(2)}%`);
    console.log(`   - Users handled per second: ${(simulatedUsers / (duration / 1000)).toFixed(2)}`);
    
    return {
      simulatedUsers,
      duration,
      avgResponseTime,
      successRate,
      usersPerSecond: simulatedUsers / (duration / 1000)
    };
  }

  async generateReport() {
    console.log('\n📊 Performance Test Report');
    console.log('='.repeat(50));
    
    // Commission List API Performance
    if (this.results.commissionList.length > 0) {
      const latest = this.results.commissionList[this.results.commissionList.length - 1];
      console.log(`\nCommission List API:`);
      console.log(`  - Average Response Time: ${latest.avgResponseTime.toFixed(2)}ms`);
      console.log(`  - Success Rate: ${latest.successRate.toFixed(2)}%`);
      console.log(`  - Requests Per Second: ${latest.rps.toFixed(2)}`);
    }
    
    // Daily Check-in API Performance
    if (this.results.dailyCheckin.length > 0) {
      const latest = this.results.dailyCheckin[this.results.dailyCheckin.length - 1];
      console.log(`\nDaily Check-in API:`);
      console.log(`  - Average Response Time: ${latest.avgResponseTime.toFixed(2)}ms`);
      console.log(`  - Success Rate: ${latest.successRate.toFixed(2)}%`);
      console.log(`  - Requests Per Second: ${latest.rps.toFixed(2)}`);
    }
    
    // Database Query Performance
    if (this.results.databaseQueries.length > 0) {
      console.log(`\nDatabase Queries:`);
      this.results.databaseQueries.forEach(query => {
        console.log(`  - ${query.name}: ${query.avgTime.toFixed(2)}ms`);
      });
    }
    
    // Performance Recommendations
    console.log(`\n🎯 Performance Recommendations:`);
    
    if (this.results.commissionList.length > 0) {
      const latest = this.results.commissionList[this.results.commissionList.length - 1];
      if (latest.avgResponseTime > 500) {
        console.log(`  ⚠️  Commission List API is slow (${latest.avgResponseTime.toFixed(2)}ms)`);
        console.log(`     Consider adding more database indexes or caching`);
      } else {
        console.log(`  ✅ Commission List API performance is good`);
      }
    }
    
    if (this.results.dailyCheckin.length > 0) {
      const latest = this.results.dailyCheckin[this.results.dailyCheckin.length - 1];
      if (latest.avgResponseTime > 1000) {
        console.log(`  ⚠️  Daily Check-in API is slow (${latest.avgResponseTime.toFixed(2)}ms)`);
        console.log(`     Consider optimizing the check-in process`);
      } else {
        console.log(`  ✅ Daily Check-in API performance is good`);
      }
    }
    
    console.log(`\n📈 Scalability Assessment:`);
    console.log(`  - System can handle: ${this.estimateUserCapacity()} concurrent users`);
    console.log(`  - Recommended for: ${this.getRecommendedUserCount()} total users`);
  }

  estimateUserCapacity() {
    if (this.results.commissionList.length === 0) return 'Unknown';
    
    const latest = this.results.commissionList[this.results.commissionList.length - 1];
    const capacity = Math.floor(latest.rps * 60 * 60); // Users per hour
    return capacity.toLocaleString();
  }

  getRecommendedUserCount() {
    const capacity = this.estimateUserCapacity();
    if (capacity === 'Unknown') return 'Unknown';
    
    const numCapacity = parseInt(capacity.replace(/,/g, ''));
    const recommended = Math.floor(numCapacity * 0.7); // 70% of capacity
    return recommended.toLocaleString();
  }
}

async function main() {
  console.log('🚀 Starting Performance Test for Commission System');
  console.log('This will test the system under various load conditions.\n');
  
  const tester = new PerformanceTester();
  
  try {
    // Test 1: Commission List API
    await tester.testCommissionListAPI(100);
    
    // Test 2: Daily Check-in API
    await tester.testDailyCheckinAPI(50);
    
    // Test 3: Database Performance
    await tester.testDatabasePerformance();
    
    // Test 4: Concurrent Users
    await tester.testConcurrentUsers(1000);
    
    // Generate Report
    await tester.generateReport();
    
    console.log('\n🎉 Performance testing completed!');
    
  } catch (error) {
    console.error('\n❌ Performance test failed:', error.message);
    process.exit(1);
  }
}

// Run the performance test
main();


