/**
 * Script to check user profile and subscription status
 * Run with: node scripts/check_user_profile.js [user_email]
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkUserProfile() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database\n');
    
    // Get all profiles
    const allProfilesQuery = `
      SELECT 
        user_id,
        email,
        name,
        plan,
        plan_type,
        plan_period,
        subscription_status,
        subscription_id,
        paddle_customer_id,
        trial_start_date,
        subscription_start_date,
        subscription_end_date
      FROM profiles
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(allProfilesQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ No profiles found in database');
      return;
    }
    
    console.log(`Found ${result.rows.length} profile(s):\n`);
    
    result.rows.forEach((profile, index) => {
      console.log(`Profile ${index + 1}:`);
      console.log('  Email:', profile.email);
      console.log('  User ID:', profile.user_id);
      console.log('  Name:', profile.name || 'N/A');
      console.log('  Old Plan Column:', profile.plan || 'N/A');
      console.log('  Plan Type:', profile.plan_type || 'FREE');
      console.log('  Plan Period:', profile.plan_period || 'N/A');
      console.log('  Subscription Status:', profile.subscription_status || 'TRIALING');
      console.log('  Subscription ID:', profile.subscription_id || 'N/A');
      console.log('  Paddle Customer ID:', profile.paddle_customer_id || 'N/A');
      console.log('  Trial Start:', profile.trial_start_date || 'N/A');
      console.log('  Subscription Start:', profile.subscription_start_date || 'N/A');
      console.log('  Subscription End:', profile.subscription_end_date || 'N/A');
      console.log('');
    });
    
    // Check for any Paddle transactions or webhooks
    console.log('\n--- Checking for webhook/transaction tables ---');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%paddle%' OR table_name LIKE '%transaction%' OR table_name LIKE '%subscription%'
    `;
    
    const tablesResult = await client.query(tablesQuery);
    if (tablesResult.rows.length > 0) {
      console.log('Related tables:', tablesResult.rows.map(r => r.table_name));
    } else {
      console.log('No Paddle/transaction tables found');
    }
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserProfile()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
