import { sql } from 'kysely';
import { createDb, json, uuid, withCompany } from './db/client';
import { readFile } from './files';
import { companyHints } from './paperHints';
import { PAPER_READER_MODEL, readPaperSheet, type SheetImage } from './paperReader';

// The paper sheet reader: a separate Lambda the API invokes asynchronously
// when an upload is confirmed, because reading takes longer than API Gateway
// allows a request (29s). It reads the page, stores the transcription, and
// marks the import READ (or FAILED with the reason). The app polls for it.

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing environment variable ${name}`);
    return value;
};

const db = createDb({
    clusterArn: required('CLUSTER_ARN'),
    secretArn: required('DB_SECRET_ARN'),
    database: required('DATABASE_NAME')
});

/** The API's 32 MB request limit, with room for the instructions: base64 grows a file by a third. */
const MAX_FILE_BYTES = 22 * 1024 * 1024;

export interface ReadPaperImportEvent {
    importId: string;
    companyId: string;
}

export const handler = async ({ importId, companyId }: ReadPaperImportEvent) => {
    const row = await withCompany(db, companyId, tx => tx.selectFrom('paper_import')
        .select(['storage_key', 'content_type', 'status'])
        .where('id', '=', uuid(importId))
        .executeTakeFirst());
    if (!row || row.status !== 'READING') return;

    const finish = (values: Record<string, unknown>) => withCompany(db, companyId, tx => tx.updateTable('paper_import')
        .set(values)
        .where('id', '=', uuid(importId))
        .where('status', '=', 'READING')
        .execute());

    try {
        const bytes = await readFile(row.storage_key);
        if (bytes.byteLength > MAX_FILE_BYTES) throw new Error('The file is too large to read (over 22 MB). Try a smaller scan or a photo.');
        const image: SheetImage = { mediaType: row.content_type as SheetImage['mediaType'], base64: Buffer.from(bytes).toString('base64') };
        const started = Date.now();
        const hints = await withCompany(db, companyId, tx => companyHints(tx));
        const reading = await readPaperSheet(image, hints);
        await finish({
            status: 'READ',
            reading: json(reading),
            template: reading.template.brand,
            reader_model: PAPER_READER_MODEL,
            error: null,
            read_at: sql`now()`
        });
        console.log(`Read paper import ${importId} (${reading.template.brand}) in ${Date.now() - started}ms${hints ? ' with company hints' : ''}`);
    } catch (error) {
        console.error(`Reading paper import ${importId} failed`, error);
        await finish({ status: 'FAILED', error: error instanceof Error ? error.message.slice(0, 500) : 'Reading failed' });
    }
};
