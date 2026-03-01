const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function getEnvVar(filePath, key) {
  const content = fs.readFileSync(filePath, 'utf8');
  const line = content.split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : null;
}

function qIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

async function main() {
  const root = process.cwd();
  const envPath = path.join(root, '.env.local');
  const dbUrl = getEnvVar(envPath, 'DATABASE_URL');

  if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const currentTables = new Set([
    'profiles',
    'projects',
    'papers',
    'project_papers',
    'extractions',
  ]);

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 20000,
  });

  await client.connect();

  const tableRows = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const allPublicTables = tableRows.rows.map((r) => r.table_name);
  const legacyTables = allPublicTables.filter((name) => !currentTables.has(name));

  const rowCounts = [];
  for (const tableName of legacyTables) {
    const countSql = `SELECT COUNT(*)::bigint AS count FROM public.${qIdent(tableName)};`;
    const countRes = await client.query(countSql);
    rowCounts.push({ table: tableName, count: Number(countRes.rows[0].count) });
  }

  const fkRows = await client.query(`
    SELECT
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND (tc.table_name = ANY($1::text[]) OR ccu.table_name = ANY($1::text[]))
    ORDER BY tc.table_name, tc.constraint_name;
  `, [legacyTables]);

  const sqlLines = [];
  sqlLines.push('-- Safe legacy cleanup plan');
  sqlLines.push('-- Strategy: archive legacy tables by moving them from public to legacy_archive schema');
  sqlLines.push('-- This is reversible and avoids hard deletion.');
  sqlLines.push('BEGIN;');
  sqlLines.push('CREATE SCHEMA IF NOT EXISTS legacy_archive;');

  for (const table of legacyTables) {
    sqlLines.push(`ALTER TABLE public.${qIdent(table)} SET SCHEMA legacy_archive;`);
  }

  sqlLines.push('COMMIT;');

  const outputSql = path.join(root, 'scripts', 'legacy_cleanup.sql');
  fs.writeFileSync(outputSql, sqlLines.join('\n') + '\n', 'utf8');

  const report = {
    generatedAt: new Date().toISOString(),
    allPublicTables,
    currentTables: Array.from(currentTables),
    legacyTables,
    legacyRowCounts: rowCounts,
    legacyRelatedForeignKeys: fkRows.rows,
    sqlFile: 'scripts/legacy_cleanup.sql',
    applyCommand: "node scripts/apply_legacy_cleanup.cjs",
  };

  const reportPath = path.join(root, 'scripts', 'legacy_cleanup_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('Legacy cleanup plan generated.');
  console.log(`- Report: ${reportPath}`);
  console.log(`- SQL: ${outputSql}`);
  console.log('- Legacy tables:', legacyTables.join(', ') || '(none)');

  await client.end();
}

main().catch((error) => {
  console.error('LEGACY_CLEANUP_PLAN_ERROR:', error.message);
  process.exit(1);
});
