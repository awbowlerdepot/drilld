import { RDSData } from '@aws-sdk/client-rds-data';
import { Kysely, Transaction, sql } from 'kysely';
import { DataApiDialect } from 'kysely-data-api';
import type { DB } from './schema';

/**
 * Kysely over the RDS Data API, connected as drilld_api (member of
 * drilld_app), so every tenant table is subject to row-level security.
 */
export const createDb = (config: { clusterArn: string; secretArn: string; database: string }): Kysely<DB> =>
    new Kysely<DB>({
        dialect: new DataApiDialect({
            mode: 'postgres',
            driver: {
                client: new RDSData({}),
                resourceArn: config.clusterArn,
                secretArn: config.secretArn,
                database: config.database
            }
        })
    });

export type Db = Kysely<DB>;
export type Tx = Transaction<DB>;

/**
 * A uuid query parameter. The Data API sends plain strings as text, and
 * Postgres won't compare text to a uuid column, so ids carry a UUID type hint.
 * Use it for every id in a query: where('id', '=', uuid(id)).
 */
export const uuid = (value: string): string =>
    ({ typeHint: 'UUID', value: { stringValue: value } }) as unknown as string;

/**
 * Runs work in one transaction scoped to a company: app.company_id is set
 * first (transaction-local), so row-level security limits every query to
 * that company. All tenant-data access goes through here.
 */
export const withCompany = <T>(db: Db, companyId: string, work: (tx: Tx) => Promise<T>): Promise<T> =>
    db.transaction().execute(async tx => {
        await sql`select set_config('app.company_id', ${companyId}, true)`.execute(tx);
        return work(tx);
    });
