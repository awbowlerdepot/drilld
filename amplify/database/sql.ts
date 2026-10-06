/**
 * Helpers for applying db/migrations through the RDS Data API, which runs one
 * statement per call. Shared by the migration runner and db/test.sh.
 */

/** The `-- migrate:up` or `-- migrate:down` section of a dbmate migration file. */
export const migrationSection = (sql: string, section: 'up' | 'down'): string => {
    const up = sql.indexOf('-- migrate:up');
    const down = sql.indexOf('-- migrate:down');
    if (up === -1 || down === -1 || down < up) {
        throw new Error('Migration must contain "-- migrate:up" followed by "-- migrate:down"');
    }
    return section === 'up'
        ? sql.slice(up + '-- migrate:up'.length, down)
        : sql.slice(down + '-- migrate:down'.length);
};

/** dbmate's version for a migration file: the part before the first underscore. */
export const migrationVersion = (fileName: string): string => fileName.split('_')[0];

/**
 * Splits SQL into statements on top-level semicolons. Semicolons inside
 * single-quoted strings, double-quoted identifiers, dollar-quoted bodies
 * ($$...$$, $tag$...$tag$) and comments do not split. Returns statements
 * without the trailing semicolon; empty and comment-only statements are dropped.
 */
export const splitSql = (sql: string): string[] => {
    const statements: string[] = [];
    let current = '';
    let i = 0;

    const pushCurrent = () => {
        if (stripComments(current).trim() !== '') {
            statements.push(current.trim());
        }
        current = '';
    };

    while (i < sql.length) {
        const ch = sql[i];
        const next = sql[i + 1];

        // -- line comment
        if (ch === '-' && next === '-') {
            const end = sql.indexOf('\n', i);
            const stop = end === -1 ? sql.length : end + 1;
            current += sql.slice(i, stop);
            i = stop;
            continue;
        }

        // /* block comment */ (Postgres allows nesting)
        if (ch === '/' && next === '*') {
            let depth = 0;
            let j = i;
            while (j < sql.length) {
                if (sql[j] === '/' && sql[j + 1] === '*') { depth++; j += 2; continue; }
                if (sql[j] === '*' && sql[j + 1] === '/') { depth--; j += 2; if (depth === 0) break; continue; }
                j++;
            }
            if (depth !== 0) throw new Error('Unterminated block comment');
            current += sql.slice(i, j);
            i = j;
            continue;
        }

        // 'string' or "identifier" ('' and "" escape the quote)
        if (ch === '\'' || ch === '"') {
            let j = i + 1;
            while (j < sql.length) {
                if (sql[j] === ch) {
                    if (sql[j + 1] === ch) { j += 2; continue; }
                    break;
                }
                j++;
            }
            if (j >= sql.length) throw new Error(`Unterminated ${ch === '\'' ? 'string' : 'quoted identifier'}`);
            current += sql.slice(i, j + 1);
            i = j + 1;
            continue;
        }

        // $tag$ ... $tag$ (tag may be empty)
        if (ch === '$') {
            const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i));
            if (tag) {
                const delimiter = tag[0];
                const end = sql.indexOf(delimiter, i + delimiter.length);
                if (end === -1) throw new Error(`Unterminated dollar-quoted string ${delimiter}`);
                current += sql.slice(i, end + delimiter.length);
                i = end + delimiter.length;
                continue;
            }
        }

        if (ch === ';') {
            pushCurrent();
            i++;
            continue;
        }

        current += ch;
        i++;
    }

    pushCurrent();
    return statements;
};

const stripComments = (sql: string): string =>
    sql.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
