import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { ImportIssue, ImportRow } from '../../utils/PaperSheetImport'

interface ImportValuesProps {
    rows: ImportRow[]
    issues: ImportIssue[]
    /** Corrects what the sheet says at this place in the reading. */
    onCorrect: (path: string[], text: string) => void
    /** Places the reviewer has corrected, by path. */
    corrected: Set<string>
}

/**
 * Everything read from the sheet: what it says (correct it if it was misread)
 * and what that becomes, then everything to check. All of it can still be
 * changed in the editor after importing.
 */
export const ImportValues = ({ rows, issues, onCorrect, corrected }: ImportValuesProps) => (
    <div className="grid gap-3">
        {issues.length > 0 && (
            <section aria-label="Check these" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-amber-900">
                    <AlertTriangle className="size-4" aria-hidden="true" /> Check {issues.length === 1 ? 'this' : `these ${issues.length}`}
                </h3>
                <ul className="mt-1.5 grid gap-1 text-sm text-amber-950">
                    {issues.map((issue, index) => <li key={index}>{issue.message}</li>)}
                </ul>
            </section>
        )}
        {rows.length === 0 ? (
            <p className="text-sm text-gray-500">No measurements were read; you'll enter them in the editor.</p>
        ) : (
            <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                        <th className="py-1 pr-2 font-medium">Value</th>
                        <th className="py-1 pr-2 font-medium">The sheet says <span className="normal-case text-gray-400">(fix if misread)</span></th>
                        <th className="py-1 font-medium">Becomes</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => {
                        const key = row.path.join('.')
                        return (
                            <tr key={`${key}-${row.label}`} className="border-t border-gray-100 align-middle">
                                <th scope="row" className="py-1.5 pr-2 text-left font-normal text-gray-700">
                                    <span className="block text-xs text-gray-500">{row.group}</span>{row.label}
                                </th>
                                <td className="py-1 pr-2">
                                    <Input aria-label={`${row.group} ${row.label}: the sheet says`} value={row.raw}
                                        onChange={event => onCorrect(row.path, event.target.value)}
                                        className={corrected.has(key) ? 'h-8 border-primary bg-blue-50 font-mono' : 'h-8 font-mono'} />
                                </td>
                                <td className="py-1.5 font-mono font-semibold text-gray-900">{row.value}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        )}
    </div>
)
