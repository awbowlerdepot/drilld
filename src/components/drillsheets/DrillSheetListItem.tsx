import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DrillSheetDto } from '../../../shared/api/drillSheets'
import { format32 } from '../../utils/Fractions'

interface DrillSheetListItemProps {
    sheet: DrillSheetDto
    onOpen: (sheet: DrillSheetDto) => void
    onSetArchived: (sheet: DrillSheetDto, archived: boolean) => void
}

const GRIP_LABELS: Record<DrillSheetDto['gripStyle'], string> = {
    FINGERTIP: 'Fingertip',
    CONVENTIONAL: 'Conventional',
    TWO_HANDED_NO_THUMB: 'Two-handed'
}

/** One drill sheet in a customer's list: its status and key measurements. */
export const DrillSheetListItem = ({ sheet, onOpen, onSetArchived }: DrillSheetListItemProps) => {
    const revision = sheet.currentRevision
    const spec = revision?.spec
    const status = !revision ? 'No revisions'
        : revision.drilled ? `Drilled · rev ${revision.version}`
            : revision.approvedAt ? `Approved · rev ${revision.version}` : `Draft · rev ${revision.version}`
    const middle = spec?.spans.thumbToMiddle.full32
    const ring = spec?.spans.thumbToRing.full32
    const bridge = spec?.bridge.distance32

    return (
        <article className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4">
            <header className="flex items-start justify-between gap-2">
                <div>
                    <h4 className="font-semibold text-gray-900">{sheet.name}</h4>
                    <p className="text-sm text-gray-600">{GRIP_LABELS[sheet.gripStyle]}</p>
                </div>
                <Badge variant={sheet.archived ? 'outline' : 'secondary'}>{sheet.archived ? 'Archived' : status}</Badge>
            </header>
            <dl className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                <div><dt className="text-gray-500">Middle (F)</dt><dd className="font-mono font-semibold">{middle ? format32(middle) : '—'}</dd></div>
                <div><dt className="text-gray-500">Ring (F)</dt><dd className="font-mono font-semibold">{ring ? format32(ring) : '—'}</dd></div>
                <div><dt className="text-gray-500">Bridge</dt><dd className="font-mono font-semibold">{bridge != null ? format32(bridge) : '—'}</dd></div>
            </dl>
            <footer className="flex items-center justify-between gap-2 text-sm text-gray-500">
                <span>Updated {new Date(sheet.updatedAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onSetArchived(sheet, !sheet.archived)}>
                        {sheet.archived ? 'Unarchive' : 'Archive'}
                    </Button>
                    <Button size="sm" onClick={() => onOpen(sheet)}>Open</Button>
                </div>
            </footer>
        </article>
    )
}
