/**
 * Script to check Supabase auth users and create missing profiles
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkAuthUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database\n');
    
    // Check auth.users table
    const authUsersQuery = `
      SELECT id, email, raw_user_meta_data, created_at
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    console.log('=== Checking auth.users ===');
    const authResult = await client.query(authUsersQuery);
    
    if (authResult.rows.length === 0) {
      console.log('❌ No users found in auth.users');
      return;
    }
    
    console.log(`Found ${authResult.rows.length} user(s) in auth.users:\n`);
    
    for (const user of authResult.rows) {
      console.log('User:');
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Metadata:', user.raw_user_meta_data);
      console.log('  Created:', user.created_at);
      
      // Check if profile exists for this user
      const profileQuery = `
        SELECT user_id, email, plan_type, subscription_status
        FROM profiles
        WHERE user_id = $1
      `;
      
      const profileResult = await client.query(profileQuery, [user.id]);
      
      if (profileResult.rows.length === 0) {
        console.log('  ⚠️  NO PROFILE EXISTS - Creating one...');
        
        // Create profile
        const createProfileQuery = `
          INSERT INTO profiles (user_id, email, name, plan_type, subscription_status, trial_start_date)
          VALUES ($1, $2, $3, 'FREE', 'TRIALING', NOW())
          ON CONFLICT (user_id) DO NOTHING
          RETURNING user_id, email, plan_type
        `;
        
        const name = user.raw_user_meta_data?.full_name || user.raw_user_meta_data?.name || null;
        
        const createResult = await client.query(createProfileQuery, [
          user.id,
          user.email,
          name
        ]);
        
        if (createResult.rows.length > 0) {
          console.log('  ✅ Profile created:', createResult.rows[0]);
        } else {
          console.log('  ℹ️  Profile already exists (conflict)');
        }
      } else {
        console.log('  ✅ Profile exists:');
        console.log('     Plan Type:', profileResult.rows[0].plan_type);
        console.log('     Subscription Status:', profileResult.rows[0].subscription_status);
      }
      
      console.log('');
    }
    
    // Now check all profiles again
    console.log('\n=== Final Profile Status ===');
    const allProfilesQuery = `
      SELECT 
        user_id,
        email,
        plan_type,
        plan_period,
        subscription_status,
        subscription_id,
        paddle_customer_id
      FROM profiles
    `;
    
    const finalResult = await client.query(allProfilesQuery);
    console.log(`Total profiles: ${finalResult.rows.length}\n`);
    
    finalResult.rows.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email}`);
      console.log(`   Plan: ${profile.plan_type} ${profile.plan_period || ''}`);
      console.log(`   Status: ${profile.subscription_status}`);
      console.log(`   Subscription ID: ${profile.subscription_id || 'N/A'}`);
      console.log(`   Paddle Customer: ${profile.paddle_customer_id || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkAuthUsers()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
