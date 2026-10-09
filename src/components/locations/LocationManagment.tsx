import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EmployeeManager } from '../../../shared/api/employees'
import { useCompanySettings } from '../../hooks/useCompanySettings'
import { useLocations } from '../../hooks/useLocations'
import { LocationCard } from './LocationCard'
import { LocationDetail } from './LocationDetail'
import { LocationProfileDialog } from './LocationProfileDialog'

interface LocationManagementProps {
    searchTerm: string
    /** The signed-in user's company access and where they manage. */
    manager: EmployeeManager
}

/**
 * The company's locations (pro shops): open now and today's hours at a
 * glance; open one for its profile, hours, equipment, grips and settings.
 * Owners and admins add and deactivate locations; a location's managers
 * edit it.
 */
export const LocationManagement = ({ searchTerm, manager }: LocationManagementProps) => {
    const { locations, loading, error, addLocation, updateLocation } = useLocations()
    const { settings: companySettings } = useCompanySettings()
    const [openId, setOpenId] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)
    const isCompanyAdmin = manager.companyRole !== null
    // Without sign-in (mock data) the manager has no managed ids, but is the owner.
    const canEdit = (id: string) => isCompanyAdmin || manager.managedLocationIDs.includes(id)

    const open = locations.find(l => l.id === openId)
    if (open) {
        return (
            <LocationDetail location={open} companySettings={companySettings} canEdit={canEdit(open.id)} canActivate={isCompanyAdmin}
                onUpdate={changes => updateLocation(open.id, changes)} onBack={() => setOpenId(null)} />
        )
    }

    const term = searchTerm.trim().toLowerCase()
    const shown = locations
        .filter(l => !term || [l.name, l.phone, l.address?.line1, l.address?.city].some(v => v?.toLowerCase().includes(term)))
        .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))

    return (
        <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
                    <p className="text-gray-600">Your pro shops: hours, equipment, what each carries, and settings.</p>
                </div>
                {isCompanyAdmin && <Button onClick={() => setAdding(true)}><Plus data-icon="inline-start" /> Add location</Button>}
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {loading ? (
                <p className="py-8 text-center text-gray-500">Loading locations…</p>
            ) : shown.length === 0 ? (
                <p className="py-8 text-center text-gray-500">{locations.length === 0 ? 'No locations yet.' : 'No locations match.'}</p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {shown.map(l => <LocationCard key={l.id} location={l} onOpen={() => setOpenId(l.id)} />)}
                </div>
            )}
            {adding && (
                <LocationProfileDialog location={null}
                    onSave={async profile => {
                        const created = await addLocation({ companyID: '', active: true, ...profile, timezone: profile.timezone })
                        setOpenId(created.id)
                    }}
                    onClose={() => setAdding(false)} />
            )}
        </div>
    )
}
