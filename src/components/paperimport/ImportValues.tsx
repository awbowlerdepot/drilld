import { AlertTriangle } from 'lucide-react'
import type { ImportIssue, ImportRow } from '../../utils/PaperSheetImport'

interface ImportValuesProps {
    rows: ImportRow[]
    issues: ImportIssue[]
}

/**
 * What the drill sheet will start with, each value beside what the sheet
 * said, then everything to check. All of it can be changed in the editor.
 */
export const ImportValues = ({ rows, issues }: ImportValuesProps) => (
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
                    <tr><th className="py-1 pr-2 font-medium">Value</th><th className="py-1 pr-2 font-medium">On the sheet</th><th className="py-1 font-medium">Becomes</th></tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-t border-gray-100 align-top">
                            <th scope="row" className="py-1.5 pr-2 text-left font-normal text-gray-700">
                                <span className="block text-xs text-gray-500">{row.group}</span>{row.label}
                            </th>
                            <td className="py-1.5 pr-2 font-mono text-gray-600">{row.raw}</td>
                            <td className="py-1.5 font-mono font-semibold text-gray-900">{row.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
    </div>
)
