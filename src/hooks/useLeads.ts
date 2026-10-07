import { useCallback, useEffect, useState } from 'react'
import type { LeadDto, LeadNoteDto, LeadStatus } from '../../shared/api/leads'
import { leadsService } from '../services/leadsService'

/** Every lead, newest first, with changes applied in place. Platform admins only. */
export const useLeads = () => {
    const [leads, setLeads] = useState<LeadDto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            setLeads(await leadsService.list())
            setError(null)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { void refresh() }, [refresh])

    const replace = (lead: LeadDto) => setLeads(prev => prev.map(l => (l.id === lead.id ? { ...lead, noteCount: l.noteCount } : l)))

    const setStatus = async (id: string, status: LeadStatus) => replace(await leadsService.setStatus(id, status))

    const remove = async (id: string) => {
        await leadsService.remove(id)
        setLeads(prev => prev.filter(l => l.id !== id))
    }

    const noteAdded = (id: string) => setLeads(prev => prev.map(l => (l.id === id ? { ...l, noteCount: l.noteCount + 1 } : l)))

    return { leads, loading, error, refresh, setStatus, remove, noteAdded }
}

/** One lead's notes, newest first. */
export const useLeadNotes = (leadId: string) => {
    const [notes, setNotes] = useState<LeadNoteDto[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        leadsService.get(leadId)
            .then(result => { if (!cancelled) setNotes(result.notes) })
            .catch(err => console.error('Could not load notes', err))
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [leadId])

    const addNote = async (body: string) => {
        const note = await leadsService.addNote(leadId, body)
        setNotes(prev => [note, ...prev])
    }

    return { notes, loading, addNote }
}
