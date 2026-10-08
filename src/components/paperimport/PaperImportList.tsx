import { FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PaperImportDto } from '../../../shared/api/paperImports'
import { templateName } from '../../utils/PaperSheetImport'

interface PaperImportListProps {
    imports: PaperImportDto[]
    onOpen: (id: string) => void
}

const STATUS: Record<string, { label: string; className: string }> = {
    UPLOADING: { label: 'Uploading', className: 'bg-gray-100 text-gray-700' },
    READING: { label: 'Reading…', className: 'bg-blue-100 text-blue-800' },
    READ: { label: 'Ready to review', className: 'bg-green-100 text-green-800' },
    FAILED: { label: 'Couldn\'t read', className: 'bg-red-100 text-red-800' }
}

const nameOf = (i: PaperImportDto) => {
    const b = i.reading?.bowler
    return [b?.firstName, b?.lastName].filter(Boolean).join(' ') || b?.name || null
}

/** Pages waiting to be imported, with who they look like and whether they've been read. */
export const PaperImportList = ({ imports, onOpen }: PaperImportListProps) => (
    <ul className="grid gap-2">
        {imports.map(i => {
            const status = STATUS[i.status] ?? STATUS.READ
            const template = templateName(i.template)
            return (
                <li key={i.id}>
                    <button type="button" onClick={() => onOpen(i.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border bg-white p-2 text-left transition-colors hover:border-primary">
                        <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
                            {i.contentType === 'application/pdf'
                                ? <FileText className="size-6 text-gray-400" aria-hidden="true" />
                                : <img src={i.viewUrl} alt="" loading="lazy" className="size-full object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-gray-900">{nameOf(i) ?? i.fileName}</span>
                            <span className="block truncate text-xs text-gray-500">
                                {[template ? `${template} sheet` : null, nameOf(i) ? i.fileName : null].filter(Boolean).join(' · ')}
                            </span>
                        </span>
                        <Badge className={status.className}>
                            {i.status === 'READING' && <Loader2 className="size-3 animate-spin" aria-hidden="true" />} {status.label}
                        </Badge>
                    </button>
                </li>
            )
        })}
    </ul>
)
