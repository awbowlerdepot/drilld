import { Textarea } from '@/components/ui/textarea'
import type { SheetEditProps } from './editorTypes'

type NotesField = 'fittingNotes' | 'notes'

const FIELDS: { key: NotesField; label: string; placeholder: string }[] = [
    { key: 'fittingNotes', label: 'Fitting notes', placeholder: 'How the fit felt, tape, what to try next time' },
    { key: 'notes', label: 'General notes', placeholder: 'Anything else for whoever drills this' }
]

/** Fitting notes and general notes. */
export const NotesPanel = ({ spec, edit, readOnly }: SheetEditProps) => (
    <section aria-label="Notes" className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4">
        {FIELDS.map(field => (
            <div key={field.key} className="flex flex-col gap-2.5 rounded-xl border border-border bg-white p-5">
                <label htmlFor={`sheet-${field.key}`} className="text-[17px] font-semibold">{field.label}</label>
                <Textarea id={`sheet-${field.key}`} rows={4} readOnly={readOnly} placeholder={readOnly ? '' : field.placeholder}
                    value={spec[field.key] ?? ''}
                    onChange={e => {
                        const value = e.target.value
                        edit(draft => { draft[field.key] = value || null })
                    }} />
            </div>
        ))}
    </section>
)
