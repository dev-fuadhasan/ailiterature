/**
 * Create enum types in PostgreSQL database
 */

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 
  'postgresql://postgres.xuquwtliobqojktgowtg:FH192168FHsumu@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function createEnums() {
  const client = await pool.connect();
  
  try {
    console.log('Creating enum types...\n');
    
    // Create PlanType enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "PlanType" AS ENUM ('FREE', 'PREMIUM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ PlanType enum created');
    
    // Create PlanPeriod enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "PlanPeriod" AS ENUM ('MONTHLY', 'YEARLY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ PlanPeriod enum created');
    
    // Create SubscriptionStatus enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'CANCELLED', 'EXPIRED', 'PAST_DUE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ SubscriptionStatus enum created');
    
    // Now alter the columns to use the enum types
    console.log('\nConverting columns to use enum types...');
    
    // First, update any invalid values
    await client.query(`
      UPDATE profiles 
      SET plan_type = 'FREE' 
      WHERE plan_type NOT IN ('FREE', 'PREMIUM') OR plan_type IS NULL
    `);
    
    await client.query(`
      UPDATE profiles 
      SET subscription_status = 'TRIALING' 
      WHERE subscription_status NOT IN ('ACTIVE', 'TRIALING', 'CANCELLED', 'EXPIRED', 'PAST_DUE') OR subscription_status IS NULL
    `);
    
    // Alter columns to use enum types
    // First drop defaults, then convert type, then re-add defaults
    console.log('\nDropping column defaults...');
    await client.query(`ALTER TABLE profiles ALTER COLUMN plan_type DROP DEFAULT`);
    await client.query(`ALTER TABLE profiles ALTER COLUMN subscription_status DROP DEFAULT`);
    
    console.log('Converting column types...');
    await client.query(`
      ALTER TABLE profiles 
      ALTER COLUMN plan_type TYPE "PlanType" USING plan_type::"PlanType"
    `);
    console.log('✅ plan_type column converted to PlanType enum');
    
    await client.query(`
      ALTER TABLE profiles 
      ALTER COLUMN plan_period TYPE "PlanPeriod" USING plan_period::"PlanPeriod"
    `);
    console.log('✅ plan_period column converted to PlanPeriod enum');
    
    await client.query(`
      ALTER TABLE profiles 
      ALTER COLUMN subscription_status TYPE "SubscriptionStatus" USING subscription_status::"SubscriptionStatus"
    `);
    console.log('✅ subscription_status column converted to SubscriptionStatus enum');
    
    console.log('Re-adding column defaults...');
    await client.query(`ALTER TABLE profiles ALTER COLUMN plan_type SET DEFAULT 'FREE'::"PlanType"`);
    await client.query(`ALTER TABLE profiles ALTER COLUMN subscription_status SET DEFAULT 'TRIALING'::"SubscriptionStatus"`);
    console.log('✅ Defaults restored');
    
    console.log('\n✅ All enum types created and columns updated!');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name IN ('plan_type', 'plan_period', 'subscription_status')
    `);
    
    console.log('\nColumn types:');
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

createEnums()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
