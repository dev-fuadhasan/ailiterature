const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getEnvVar(filePath, key) {
  const content = fs.readFileSync(filePath, 'utf8');
  const line = content.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : null;
}

(async () => {
  const envPath = path.join(process.cwd(), '.env.local');
  const dbUrl = getEnvVar(envPath, 'DATABASE_URL');
  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
    query_timeout: 15000,
  });

  await client.connect();
  const ping = await client.query('select current_database() as db, current_user as user, now() as ts');
  console.log('CONNECTED:', ping.rows[0]);

  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name;
  `);

  console.log('TABLES:', tables.rows.map((r) => r.table_name));

  const columns = await client.query(`
    select table_name, column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('profiles','projects','papers','project_papers','extractions')
    order by table_name, ordinal_position;
  `);

  console.log('COLUMNS:', JSON.stringify(columns.rows, null, 2));

  await client.end();
})().catch((error) => {
  console.error('DB_PROBE_ERROR:', error.message);
  process.exit(1);
});
