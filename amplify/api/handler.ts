import { handle } from 'hono/aws-lambda';
import { createApp } from './app';
import { createDb } from './db/client';

const required = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing environment variable ${name}`);
    return value;
};

// Created once per Lambda container and reused across requests.
const db = createDb({
    clusterArn: required('CLUSTER_ARN'),
    secretArn: required('DB_SECRET_ARN'),
    database: required('DATABASE_NAME')
});

export const handler = handle(createApp(db));
