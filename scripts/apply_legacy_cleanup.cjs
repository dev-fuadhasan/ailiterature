const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getEnvVar(filePath, key) {
  const content = fs.readFileSync(filePath, 'utf8');
  const line = content.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : null;
}

async function main() {
  const root = process.cwd();
  const envPath = path.join(root, '.env.local');
  const dbUrl = getEnvVar(envPath, 'DATABASE_URL');
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const sqlPath = path.join(root, 'scripts', 'legacy_cleanup.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Missing cleanup SQL. Run: node scripts/legacy_cleanup_plan.cjs');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
  });

  await client.connect();
  await client.query(sql);
  await client.end();

  console.log('Legacy cleanup SQL applied successfully.');
}

main().catch((error) => {
  console.error('APPLY_LEGACY_CLEANUP_ERROR:', error.message);
  process.exit(1);
});
