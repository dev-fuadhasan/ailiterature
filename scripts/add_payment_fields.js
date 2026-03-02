/**
 * Add payment method fields to profiles table
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function addPaymentFields() {
  const client = await pool.connect();
  
  try {
    console.log('Adding payment method fields...\n');
    
    // Add payment method fields
    const alterStatements = [
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method_id TEXT`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS card_last4 TEXT`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS card_type TEXT`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS card_expiry_month INTEGER`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS card_expiry_year INTEGER`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT true`,
    ];
    
    for (const statement of alterStatements) {
      console.log('Executing:', statement);
      await client.query(statement);
    }
    
    console.log('\n✅ All payment method fields added!');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('payment_method_id', 'card_last4', 'card_type', 'card_expiry_month', 'card_expiry_year', 'auto_renewal')
    `);
    
    console.log('\nNew columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addPaymentFields()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
