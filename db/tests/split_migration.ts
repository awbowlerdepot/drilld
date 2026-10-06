// Prints a migration section's statements, NUL-separated, using the same
// splitter as the RDS Data API migration runner (amplify/database/sql.ts).
// Usage: tsx db/tests/split_migration.ts <file.sql> <up|down>
import { readFileSync } from 'node:fs';
import { migrationSection, splitSql } from '../../amplify/database/sql';

const [file, section] = process.argv.slice(2);
if (!file || (section !== 'up' && section !== 'down')) {
    console.error('Usage: split_migration.ts <file.sql> <up|down>');
    process.exit(2);
}
process.stdout.write(splitSql(migrationSection(readFileSync(file, 'utf8'), section)).join('\0'));
