import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLeadNotes } from '../../hooks/useLeads'

interface LeadNotesProps {
    leadId: string
    onAdded: () => void
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** A lead's running log, newest first: calls, emails, demos. */
export const LeadNotes = ({ leadId, onAdded }: LeadNotesProps) => {
    const { notes, loading, addNote } = useLeadNotes(leadId)
    const [draft, setDraft] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const add = async () => {
        setSaving(true)
        setError(null)
        try {
            await addNote(draft.trim())
            setDraft('')
            onAdded()
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <section aria-label="Notes" className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</h3>
            <form className="space-y-2" onSubmit={event => { event.preventDefault(); void add() }}>
                <Textarea rows={2} placeholder="Called; they run 2 shops, demo Tuesday…" aria-label="New note"
                    value={draft} onChange={event => setDraft(event.target.value)} />
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <Button type="submit" size="sm" disabled={!draft.trim() || saving}>{saving ? 'Adding…' : 'Add note'}</Button>
            </form>
            {loading ? <p className="text-sm text-gray-500">Loading notes…</p> : notes.length === 0 ? (
                <p className="text-sm text-gray-500">No notes yet.</p>
            ) : (
                <ol className="space-y-2">
                    {notes.map(note => (
                        <li key={note.id} className="rounded-lg border border-border px-3 py-2">
                            <span className="block text-xs text-gray-500">{note.authorName} · {when(note.createdAt)}</span>
                            <span className="whitespace-pre-wrap text-sm text-gray-900">{note.body}</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}
