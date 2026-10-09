import { useState } from 'react'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CompanySettings, Location } from '../../types'
import { LocationGripStock } from './grips/LocationGripStock'
import { LocationHoursTab } from './hours/LocationHoursTab'
import { LocationEquipmentList } from './LocationEquipmentList'
import { LocationOpenBadge } from './LocationOpenBadge'
import { LocationOverview } from './LocationOverview'
import { LocationProfileDialog } from './LocationProfileDialog'
import { LocationSettingsTab } from './LocationSettingsTab'

type Tab = 'overview' | 'hours' | 'equipment' | 'stock' | 'settings'

const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'hours', label: 'Hours' },
    { key: 'equipment', label: 'Equipment' },
    { key: 'stock', label: 'What we carry' },
    { key: 'settings', label: 'Settings' }
]

interface LocationDetailProps {
    location: Location
    companySettings: CompanySettings
    /** Manages this location's settings (a manager here, or company owners and admins). */
    canEdit: boolean
    /** Can deactivate or reactivate it (company owners and admins). */
    canActivate: boolean
    onUpdate: (changes: Partial<Location>) => Promise<void>
    onBack: () => void
}

/** One location: its profile, hours, equipment, the grips it carries, and its settings. */
export const LocationDetail = ({ location, companySettings, canEdit, canActivate, onUpdate, onBack }: LocationDetailProps) => {
    const [tab, setTab] = useState<Tab>('overview')
    const [editing, setEditing] = useState(false)
    const [confirmDeactivate, setConfirmDeactivate] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const setActive = async (active: boolean) => {
        setError(null)
        try {
            await onUpdate({ active })
            setConfirmDeactivate(false)
        } catch (err) {
            setError((err as Error).message)
        }
    }

    return (
        <div className="grid gap-5">
            <div>
                <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft data-icon="inline-start" /> Locations</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
                {location.active ? <LocationOpenBadge location={location} /> : <Badge variant="outline">Inactive</Badge>}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {canActivate && (location.active ? (
                        confirmDeactivate ? (
                            <>
                                <span className="text-sm text-gray-600">Deactivate {location.name}? Its history stays.</span>
                                <Button variant="outline" size="sm" onClick={() => setConfirmDeactivate(false)}>Keep active</Button>
                                <Button variant="destructive" size="sm" onClick={() => void setActive(false)}>Deactivate</Button>
                            </>
                        ) : <Button variant="ghost" size="sm" onClick={() => setConfirmDeactivate(true)}>Deactivate</Button>
                    ) : <Button variant="outline" size="sm" onClick={() => void setActive(true)}>Reactivate</Button>)}
                    {canEdit && <Button variant="outline" onClick={() => setEditing(true)}><Pencil data-icon="inline-start" /> Edit profile</Button>}
                </div>
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            <div role="tablist" aria-label="Location" className="flex flex-wrap gap-1 border-b border-border">
                {TABS.map(t => (
                    <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                        className={cn('-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                            tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-600 hover:text-gray-900')}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="rounded-xl border border-border bg-white p-4 sm:p-5">
                {tab === 'overview' && <LocationOverview location={location} />}
                {tab === 'hours' && <LocationHoursTab location={location} canEdit={canEdit} onSave={hours => onUpdate({ hours })} />}
                {tab === 'equipment' && <LocationEquipmentList location={location} />}
                {tab === 'stock' && <LocationGripStock location={location} />}
                {tab === 'settings' && (
                    <LocationSettingsTab location={location} companySettings={companySettings} canEdit={canEdit}
                        onSave={settingsOverrides => onUpdate({ settingsOverrides })} />
                )}
            </div>

            {editing && <LocationProfileDialog location={location} onSave={profile => onUpdate(profile)} onClose={() => setEditing(false)} />}
        </div>
    )
}
