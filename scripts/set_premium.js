/**
 * Script to manually set a user to PREMIUM (for testing)
 * Run with: node scripts/set_premium.js [email]
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const email = process.argv[2] || 'thisemailforostad@gmail.com';

async function setPremium() {
  const client = await pool.connect();
  
  try {
    console.log(`Setting ${email} to PREMIUM...\n`);
    
    // Update profile to PREMIUM
    const updateQuery = `
      UPDATE profiles
      SET 
        plan_type = 'PREMIUM',
        plan_period = 'MONTHLY',
        subscription_status = 'ACTIVE',
        subscription_start_date = NOW(),
        subscription_end_date = NOW() + INTERVAL '1 month'
      WHERE email = $1
      RETURNING user_id, email, plan_type, plan_period, subscription_status
    `;
    
    const result = await client.query(updateQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log(`❌ No profile found for ${email}`);
      return;
    }
    
    console.log('✅ Updated to PREMIUM:');
    console.log(result.rows[0]);
    console.log('\n✨ You can now test the premium features!');
    console.log('🔄 Refresh your dashboard to see the changes');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setPremium()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
