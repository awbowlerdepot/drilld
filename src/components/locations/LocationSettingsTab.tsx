import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { CompanySettings, Location, LocationSettingsOverrides } from '../../types'
import { LocationSettingsOverridesForm } from './LocationSettingsOverridesForm'

interface LocationSettingsTabProps {
    location: Location
    companySettings: CompanySettings
    canEdit: boolean
    onSave: (overrides: LocationSettingsOverrides) => Promise<void>
}

/** Company settings this location does differently (labor rate, tax, notifications, workflow). */
export const LocationSettingsTab = ({ location, companySettings, canEdit, onSave }: LocationSettingsTabProps) => {
    const saved = location.settingsOverrides ?? {}
    const [overrides, setOverrides] = useState<LocationSettingsOverrides>(saved)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const dirty = JSON.stringify(overrides) !== JSON.stringify(saved)

    const save = async () => {
        setSaving(true)
        setError(null)
        try {
            await onSave(overrides)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="grid gap-4">
            <fieldset disabled={!canEdit}>
                <LocationSettingsOverridesForm overrides={overrides} companySettings={companySettings} onChange={setOverrides} />
            </fieldset>
            {canEdit && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                    <div className="ml-auto flex gap-2">
                        {dirty && <Button type="button" variant="ghost" onClick={() => setOverrides(saved)}>Discard</Button>}
                        <Button type="button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save settings'}</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
