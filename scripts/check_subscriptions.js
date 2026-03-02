/**
 * Check subscription table and webhook logs
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkSubscriptionTable() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking subscription table ===\n');
    
    // Check if subscription table exists and what's in it
    const subsQuery = `
      SELECT * FROM subscription
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    try {
      const result = await client.query(subsQuery);
      console.log(`Found ${result.rows.length} subscription(s):\n`);
      
      result.rows.forEach((sub, i) => {
        console.log(`${i + 1}.`, sub);
        console.log('');
      });
    } catch (err) {
      console.log('No subscription table or empty');
    }
    
    // Check for any webhook log tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%webhook%' 
        OR table_name LIKE '%log%'
        OR table_name LIKE '%event%'
      )
      ORDER BY table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    console.log('\n=== Related tables ===');
    console.log(tablesResult.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSubscriptionTable()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
