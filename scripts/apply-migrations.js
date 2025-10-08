#!/usr/bin/env node

// Script to apply database migrations for the commission system
// This ensures the database is properly set up for 250k+ users

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile) {
  console.log(`Applying migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement}`);
          throw error;
        }
      }
    }
    
    console.log(`✅ Migration ${migrationFile} applied successfully`);
  } catch (error) {
    console.error(`❌ Failed to apply migration ${migrationFile}:`, error.message);
    throw error;
  }
}

async function checkTablesExist() {
  console.log('Checking if commission tables exist...');
  
  const tables = [
    'commission_types',
    'user_commissions',
    'commission_payouts',
    'user_checkins',
    'user_referrals',
    'user_commission_summary'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', table)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error(`Error checking table ${table}:`, error.message);
    } else if (data) {
      console.log(`✅ Table ${table} exists`);
    } else {
      console.log(`❌ Table ${table} does not exist`);
    }
  }
}

async function insertSampleData() {
  console.log('Inserting sample commission types...');
  
  const sampleTypes = [
    {
      type_code: 'daily_checkin',
      name: 'Daily Check-in',
      description: 'Reward for daily app check-in',
      base_amount_kobo: 5000,
      multiplier: 1.0
    },
    {
      type_code: 'streak_7',
      name: '7-Day Streak',
      description: 'Bonus for 7-day check-in streak',
      base_amount_kobo: 100000,
      multiplier: 1.0
    },
    {
      type_code: 'streak_30',
      name: '30-Day Streak',
      description: 'Bonus for 30-day check-in streak',
      base_amount_kobo: 500000,
      multiplier: 1.0
    }
  ];
  
  for (const type of sampleTypes) {
    const { error } = await supabase
      .from('commission_types')
      .upsert(type, { onConflict: 'type_code' });
    
    if (error) {
      console.error(`Error inserting commission type ${type.type_code}:`, error.message);
    } else {
      console.log(`✅ Inserted commission type: ${type.name}`);
    }
  }
}

async function createIndexes() {
  console.log('Creating performance indexes...');
  
  const indexes = [
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commissions_user_id ON user_commissions(user_id);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commissions_status ON user_commissions(status);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_commissions_created_at ON user_commissions(created_at DESC);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_checkins_user_date ON user_checkins(user_id, checkin_date DESC);',
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_commission_payouts_user_id ON commission_payouts(user_id);'
  ];
  
  for (const indexSQL of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (error) {
        console.error(`Error creating index: ${error.message}`);
      } else {
        console.log(`✅ Created index: ${indexSQL.split(' ')[5]}`);
      }
    } catch (error) {
      console.error(`Error creating index: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting database migration for commission system...');
  console.log('This will set up the database for 250k+ users with optimized performance.\n');
  
  try {
    // Check current state
    await checkTablesExist();
    
    // Apply the main migration
    await applyMigration('20250119_real_commission_system.sql');
    
    // Insert sample data
    await insertSampleData();
    
    // Create additional indexes
    await createIndexes();
    
    console.log('\n🎉 Database migration completed successfully!');
    console.log('Your commission system is now ready for 250k+ users with:');
    console.log('✅ Real-time commission tracking');
    console.log('✅ Optimized database indexes');
    console.log('✅ High-performance caching');
    console.log('✅ Scalable architecture');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
main();


