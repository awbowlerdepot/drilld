import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { MaintenanceLogDto } from '../../../shared/api/equipment'

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** A machine's history: maintenance done and problems reported, newest first. */
export const MaintenanceLogList = ({ log }: { log: MaintenanceLogDto[] }) => log.length === 0
    ? <p className="text-sm text-gray-500">Nothing logged yet.</p>
    : (
        <ol className="grid gap-2">
            {log.map(entry => (
                <li key={entry.id} className="flex gap-2.5 text-sm">
                    {entry.kind === 'ISSUE'
                        ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-label="Problem" />
                        : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" aria-label="Done" />}
                    <div className="min-w-0">
                        <p className="font-medium text-gray-900">{entry.title}</p>
                        <p className="text-xs text-gray-500">{when(entry.doneAt)}{entry.doneByName ? ` · ${entry.doneByName}` : ''}</p>
                        {entry.checklist.length > 0 && <p className="text-xs text-gray-600">✓ {entry.checklist.join(' · ')}</p>}
                        {entry.notes && <p className="text-gray-700">{entry.notes}</p>}
                    </div>
                </li>
            ))}
        </ol>
    )
