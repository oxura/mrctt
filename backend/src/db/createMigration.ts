import { promises as fs } from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function createMigration() {
  const name = process.argv[2];

  if (!name) {
    console.error('Please provide a migration name: npm run migrate:create -- migration_name');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- Migration: ${name}\n-- Created at ${new Date().toISOString()}\n\nBEGIN;\n\n-- Write migration SQL here\n\nCOMMIT;\n`;

  await fs.writeFile(filePath, template, { flag: 'wx' });

  console.log(`Created migration file: migrations/${filename}`);
}

createMigration().catch((err) => {
  console.error('Failed to create migration file', err);
  process.exit(1);
});
