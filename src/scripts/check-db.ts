import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    // Basic connection checks
    const versionResult = await db.execute(sql`select version()`);
    const dbnameResult = await db.execute(sql`select current_database() as name`);

    const version = ((versionResult as unknown) as Array<Record<string, unknown>>)[0]?.['version'];
    const dbName = ((dbnameResult as unknown) as Array<Record<string, unknown>>)[0]?.['name'];

    console.log('Database connection: OK');
    console.log(`Current database: ${dbName}`);
    console.log(`PostgreSQL version: ${version}`);

    // List public tables
    const tables = ((await db.execute(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name
    `)) as unknown) as Array<{ table_name: string }>;

    if (!tables.length) {
      console.log('No tables found in schema public.');
      return;
    }

    console.log('\nTables in public schema:');
    for (const { table_name } of tables) {
      const countRes = ((await db.execute(sql`select count(*)::int as count from ${sql.identifier('public')}.${sql.identifier(table_name)}`)) as unknown) as Array<{ count: number }>;
      const count = countRes?.[0]?.count ?? 0;
      console.log(`- ${table_name}: ${count} rows`);
    }

    // Show sample rows for a few known tables if present
    const interestingTables = [
      'users',
      'clients',
      'projects',
      'tasks',
      'time_entries',
      'sessions',
    ];

    for (const t of interestingTables) {
      const present = tables.some((row) => row.table_name === t);
      if (!present) continue;
      console.log(`\nSample rows from ${t}:`);
      const rows = ((await db.execute(sql`select * from ${sql.identifier('public')}.${sql.identifier(t)} order by 1 desc limit 5`)) as unknown) as Array<Record<string, unknown>>;
      if (!rows || rows.length === 0) {
        console.log('(no rows)');
      } else {
        for (const row of rows) {
          console.log(row);
        }
      }
    }
  } catch (err) {
    console.error('Database check failed:', err);
    process.exitCode = 1;
  }
}

// Run
main().then(() => {
  // noop - allow process to exit
});


