import { readingCorrections, type PaperSheetReading } from '../../shared/api/paperReading';
import type { Tx } from './db/client';

// A company's past corrections, as hints for reading its next sheets. The same
// person usually filled in a shop's sheets for years, so the reader tends to
// make the same mistakes on the same handwriting (a 15 read as 13, a slashed
// zero read as 9).

const RECENT_IMPORTS = 30;
const MAX_HINTS = 40;
/** The bowler's own details aren't handwriting habits. */
const PERSONAL = /^bowler\./;

export const companyHints = async (tx: Tx): Promise<string | undefined> => {
    const rows = await tx.selectFrom('paper_import')
        .select(['template', 'reading', 'corrected_reading'])
        .where('status', '=', 'IMPORTED')
        .where('corrected_reading', 'is not', null)
        .orderBy('imported_at', 'desc')
        .limit(RECENT_IMPORTS)
        .execute();
    const lines: string[] = [];
    for (const row of rows) {
        if (!row.reading || !row.corrected_reading) continue;
        for (const c of readingCorrections(row.reading as PaperSheetReading, row.corrected_reading as PaperSheetReading)) {
            if (PERSONAL.test(c.field)) continue;
            lines.push(`- On a ${row.template ?? 'paper'} sheet, ${c.field} was read as "${c.read}" but the sheet says "${c.corrected}".`);
            if (lines.length >= MAX_HINTS) break;
        }
        if (lines.length >= MAX_HINTS) break;
    }
    return lines.length > 0 ? `Past readings of this shop's sheets that a person corrected (this shop's handwriting):\n${lines.join('\n')}` : undefined;
};
