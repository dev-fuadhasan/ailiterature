/**
 * Script to manually set a user to YEARLY PREMIUM
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const email = process.argv[2] || 'thisemailforostad@gmail.com';

async function setYearly() {
  const client = await pool.connect();
  
  try {
    console.log(`Setting ${email} to PREMIUM YEARLY...\n`);
    
    // Update profile to PREMIUM YEARLY
    const updateQuery = `
      UPDATE profiles
      SET 
        plan_type = 'PREMIUM',
        plan_period = 'YEARLY',
        subscription_status = 'ACTIVE',
        subscription_start_date = NOW(),
        subscription_end_date = NOW() + INTERVAL '1 year'
      WHERE email = $1
      RETURNING user_id, email, plan_type, plan_period, subscription_status, subscription_end_date
    `;
    
    const result = await client.query(updateQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log(`❌ No profile found for ${email}`);
      return;
    }
    
    console.log('✅ Updated to PREMIUM YEARLY:');
    console.log('  Email:', result.rows[0].email);
    console.log('  Plan:', result.rows[0].plan_type, result.rows[0].plan_period);
    console.log('  Status:', result.rows[0].subscription_status);
    console.log('  Expires:', result.rows[0].subscription_end_date);
    console.log('\n✨ Your account is now PREMIUM YEARLY!');
    console.log('🔄 Refresh your dashboard to see the changes');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setYearly()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
