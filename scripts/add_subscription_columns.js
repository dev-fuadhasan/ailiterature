/**
 * Script to add subscription columns to profiles table in Supabase
 * Run this with: node scripts/add_subscription_columns.js
 */

const { Pool } = require('pg');

// Use the pooler connection
const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function addSubscriptionColumns() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database');
    
    // Check if columns exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND table_schema = 'public'
    `;
    
    const result = await client.query(checkQuery);
    const existingColumns = result.rows.map(row => row.column_name);
    
    console.log('Existing columns in profiles table:', existingColumns);
    
    // List of columns we need
    const requiredColumns = [
      'plan_type',
      'plan_period',
      'subscription_status',
      'subscription_id',
      'paddle_customer_id',
      'literature_review_count',
      'trial_start_date',
      'trial_end_date',
      'subscription_start_date',
      'subscription_end_date'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All subscription columns already exist!');
      
      // Check a sample profile to see the data
      const sampleQuery = `SELECT user_id, email, plan_type, plan_period, subscription_status FROM profiles LIMIT 5`;
      const sampleResult = await client.query(sampleQuery);
      console.log('\nSample profiles:', sampleResult.rows);
      
      return;
    }
    
    console.log('Missing columns:', missingColumns);
    console.log('Adding missing columns...');
    
    // Add missing columns
    const alterStatements = [];
    
    if (!existingColumns.includes('plan_type')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'FREE'`);
    }
    
    if (!existingColumns.includes('plan_period')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_period TEXT`);
    }
    
    if (!existingColumns.includes('subscription_status')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'TRIALING'`);
    }
    
    if (!existingColumns.includes('subscription_id')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT`);
    }
    
    if (!existingColumns.includes('paddle_customer_id')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT`);
    }
    
    if (!existingColumns.includes('literature_review_count')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS literature_review_count INTEGER DEFAULT 0`);
    }
    
    if (!existingColumns.includes('trial_start_date')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP DEFAULT NOW()`);
    }
    
    if (!existingColumns.includes('trial_end_date')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP`);
    }
    
    if (!existingColumns.includes('subscription_start_date')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP`);
    }
    
    if (!existingColumns.includes('subscription_end_date')) {
      alterStatements.push(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP`);
    }
    
    // Execute all alter statements
    for (const statement of alterStatements) {
      console.log('Executing:', statement);
      await client.query(statement);
    }
    
    console.log('✅ All missing columns have been added!');
    
    // Verify the changes
    const verifyResult = await client.query(checkQuery);
    const updatedColumns = verifyResult.rows.map(row => row.column_name);
    console.log('\nUpdated columns in profiles table:', updatedColumns);
    
    // Check a sample profile
    const sampleQuery = `SELECT user_id, email, plan_type, plan_period, subscription_status FROM profiles LIMIT 5`;
    const sampleResult = await client.query(sampleQuery);
    console.log('\nSample profiles:', sampleResult.rows);
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addSubscriptionColumns()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
