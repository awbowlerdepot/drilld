import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { locationCreateSchema } from '../../../shared/api/locations'
import type { Location } from '../../types'

interface LocationProfileDialogProps {
    /** Null to add a location. */
    location: Location | null
    onSave: (profile: Pick<Location, 'name' | 'address' | 'phone' | 'email' | 'website' | 'timezone'>) => Promise<void>
    onClose: () => void
}

/** US time zones first; the location's own is always offered. */
const US_ZONES = [
    { value: 'America/New_York', label: 'Eastern' },
    { value: 'America/Chicago', label: 'Central' },
    { value: 'America/Denver', label: 'Mountain' },
    { value: 'America/Phoenix', label: 'Arizona (no DST)' },
    { value: 'America/Los_Angeles', label: 'Pacific' },
    { value: 'America/Anchorage', label: 'Alaska' },
    { value: 'Pacific/Honolulu', label: 'Hawaii' }
]

/**
 * A location's profile: name, address, phone, email, website and time zone.
 * Listing platforms (Google, Facebook, Apple, Yelp) need the full address.
 */
export const LocationProfileDialog = ({ location, onSave, onClose }: LocationProfileDialogProps) => {
    const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const [name, setName] = useState(location?.name ?? '')
    const [line1, setLine1] = useState(location?.address?.line1 ?? '')
    const [line2, setLine2] = useState(location?.address?.line2 ?? '')
    const [city, setCity] = useState(location?.address?.city ?? '')
    const [region, setRegion] = useState(location?.address?.region ?? '')
    const [postalCode, setPostalCode] = useState(location?.address?.postalCode ?? '')
    const [phone, setPhone] = useState(location?.phone ?? '')
    const [email, setEmail] = useState(location?.email ?? '')
    const [website, setWebsite] = useState(location?.website ?? '')
    const [timezone, setTimezone] = useState(location?.timezone ?? (US_ZONES.some(z => z.value === browserZone) ? browserZone : 'America/Denver'))
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const zones = US_ZONES.some(z => z.value === timezone) ? US_ZONES : [...US_ZONES, { value: timezone, label: timezone }]

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const address = { line1, line2, city, region, postalCode, country: location?.address?.country ?? 'US' }
        const anyAddress = [line1, line2, city, region, postalCode].some(part => part.trim())
        const parsed = locationCreateSchema.safeParse({ name, address: anyAddress ? address : null, phone, email, website, timezone })
        if (!parsed.success) {
            const found: Record<string, string> = {}
            for (const issue of parsed.error.issues) found[String(issue.path[issue.path.length - 1])] ??= issue.message
            setErrors(found)
            return
        }
        setSaving(true)
        try {
            const p = parsed.data
            await onSave({
                name: p.name, address: p.address ?? undefined, phone: p.phone ?? undefined,
                email: p.email ?? undefined, website: p.website ?? undefined, timezone: p.timezone
            })
            onClose()
        } catch (err) {
            setErrors({ form: (err as Error).message })
            setSaving(false)
        }
    }

    const text = (id: string, label: string, value: string, set: (value: string) => void, props: React.ComponentProps<typeof Input> = {}) => (
        <Field data-invalid={!!errors[id]}>
            <FieldLabel htmlFor={`location-${id}`}>{label}</FieldLabel>
            <Input id={`location-${id}`} value={value} aria-invalid={!!errors[id]}
                onChange={event => { set(event.target.value); setErrors(prev => ({ ...prev, [id]: '' })) }} {...props} />
            {errors[id] && <FieldError>{errors[id]}</FieldError>}
        </Field>
    )

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <form className="grid gap-5" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{location ? `Edit ${location.name}` : 'Add a location'}</DialogTitle>
                        <DialogDescription>What customers see on your listings: Google, Facebook, Apple Maps and Yelp all use the full address.</DialogDescription>
                    </DialogHeader>
                    <FieldGroup className="grid gap-4">
                        {text('name', 'Name', name, setName, { autoFocus: !location })}
                        {text('line1', 'Street address', line1, setLine1, { autoComplete: 'address-line1' })}
                        {text('line2', 'Suite, unit (optional)', line2, setLine2, { autoComplete: 'address-line2' })}
                        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                            {text('city', 'City', city, setCity, { autoComplete: 'address-level2' })}
                            {text('region', 'State', region, setRegion, { autoComplete: 'address-level1', maxLength: 30 })}
                            {text('postalCode', 'ZIP', postalCode, setPostalCode, { autoComplete: 'postal-code', inputMode: 'numeric' })}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {text('phone', 'Phone', phone, setPhone, { type: 'tel', autoComplete: 'tel' })}
                            {text('email', 'Email (optional)', email, setEmail, { type: 'email' })}
                        </div>
                        {text('website', 'Website (optional)', website, setWebsite, { type: 'url', placeholder: 'https://' })}
                        <Field>
                            <FieldLabel htmlFor="location-timezone">Time zone</FieldLabel>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger id="location-timezone" className="sm:w-64"><SelectValue /></SelectTrigger>
                                <SelectContent>{zones.map(z => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </Field>
                    </FieldGroup>
                    {errors.form && <p role="alert" className="text-sm text-red-700">{errors.form}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : location ? 'Save' : 'Add location'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
