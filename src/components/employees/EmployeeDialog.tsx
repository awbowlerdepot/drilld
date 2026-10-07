import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    accessChangeError,
    canEditEmployee,
    canSeePay,
    employeeDetailsSchema,
    employeeEmailSchema,
    type EmployeeCreate,
    type EmployeeManager,
    type EmployeeUpdate
} from '../../../shared/api/employees'
import type { CompanyRole, Employee, Location, LocationMembership } from '../../types'
import { COMPANY_ROLE_OPTIONS } from '../../utils/EmployeeRoles'
import { EmployeeMembershipsInput } from './EmployeeMembershipsInput'
import { EmployeeSpecialtiesInput } from './EmployeeSpecialtiesInput'
import { EmployeeStatusActions } from './EmployeeStatusActions'

interface EmployeeDialogProps {
    /** Null to invite someone new. */
    employee: Employee | null
    locations: Location[]
    manager: EmployeeManager
    onCreate: (input: EmployeeCreate) => Promise<void>
    onUpdate: (changes: EmployeeUpdate) => Promise<void>
    onResendInvite: () => Promise<void>
    onCancelInvite: () => Promise<void>
    onClose: () => void
}

const NO_COMPANY_ROLE = 'NONE'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const sortMemberships = (list: LocationMembership[]) => [...list].sort((a, b) => a.locationID.localeCompare(b.locationID))

/**
 * Invite an employee, or view and edit one: details, company access, their
 * role at each location, and sign-in status. Fields the manager can't change
 * are locked (shared/api/employees.ts has the rules).
 */
export const EmployeeDialog = ({ employee, locations, manager, onCreate, onUpdate, onResendInvite, onCancelInvite, onClose }: EmployeeDialogProps) => {
    const isNew = employee === null
    const readOnly = !isNew && !canEditEmployee(manager, employee)
    const showPay = canSeePay(manager)
    const isSelf = employee?.id === manager.userId

    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState(employee?.firstName ?? '')
    const [lastName, setLastName] = useState(employee?.lastName ?? '')
    const [phone, setPhone] = useState(employee?.phone ?? '')
    const [hireDate, setHireDate] = useState(employee?.hireDate ?? '')
    const [hourlyRate, setHourlyRate] = useState(employee?.hourlyRate != null ? employee.hourlyRate.toFixed(2) : '')
    const [companyRole, setCompanyRole] = useState<CompanyRole | null>(employee?.companyRole ?? null)
    const [memberships, setMemberships] = useState<LocationMembership[]>(employee?.memberships ?? [])
    const [specialties, setSpecialties] = useState<string[]>(employee?.specialties ?? [])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    // Company access is for owners and admins to give; only an owner makes an owner, and nobody changes their own.
    const companyRoleLocked = readOnly || !manager.companyRole || isSelf
    const companyRoleOptions = COMPANY_ROLE_OPTIONS.filter(option => option.value !== 'OWNER' || manager.companyRole === 'OWNER' || companyRole === 'OWNER')

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const found: Record<string, string> = {}
        const details = employeeDetailsSchema.safeParse({
            firstName, lastName, phone, hireDate, specialties,
            hourlyRate: showPay && hourlyRate.trim() !== '' ? Number(hourlyRate) : null
        })
        if (!details.success) {
            for (const issue of details.error.issues) found[String(issue.path[0])] ??= issue.message
        }
        const parsedEmail = employeeEmailSchema.safeParse(email)
        if (isNew && !parsedEmail.success) found.email = parsedEmail.error.issues[0]?.message ?? 'Enter a valid email'
        const accessError = accessChangeError(manager, employee, { companyRole, memberships })
        if (accessError) found.access = accessError
        setErrors(found)
        if (!details.success || Object.keys(found).length > 0) return
        const fields = details.data

        setSaving(true)
        try {
            if (isNew) {
                await onCreate({ email: parsedEmail.data ?? email, ...fields, companyRole, memberships })
            } else {
                // Only what changed, so a manager never sends fields they can't set.
                const changes: EmployeeUpdate = {}
                if (fields.firstName !== employee.firstName) changes.firstName = fields.firstName
                if (fields.lastName !== employee.lastName) changes.lastName = fields.lastName
                if (fields.phone !== employee.phone) changes.phone = fields.phone
                if (fields.hireDate !== employee.hireDate) changes.hireDate = fields.hireDate
                if (showPay && fields.hourlyRate !== (employee.hourlyRate ?? null)) changes.hourlyRate = fields.hourlyRate
                if (!same(fields.specialties, employee.specialties)) changes.specialties = fields.specialties
                if (companyRole !== employee.companyRole) changes.companyRole = companyRole
                if (!same(sortMemberships(memberships), sortMemberships(employee.memberships))) changes.memberships = memberships
                if (Object.keys(changes).length > 0) await onUpdate(changes)
            }
            onClose()
        } catch (err) {
            setErrors({ form: (err as Error).message })
            setSaving(false)
        }
    }

    const text = (id: string, label: string, value: string, set: (value: string) => void, props: React.ComponentProps<typeof Input> = {}) => (
        <Field data-invalid={!!errors[id]}>
            <FieldLabel htmlFor={`employee-${id}`}>{label}</FieldLabel>
            <Input id={`employee-${id}`} value={value} disabled={readOnly} aria-invalid={!!errors[id]}
                onChange={event => { set(event.target.value); setErrors(prev => ({ ...prev, [id]: '' })) }} {...props} />
            {errors[id] && <FieldError>{errors[id]}</FieldError>}
        </Field>
    )

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <form className="grid gap-5" onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>{isNew ? 'Invite an employee' : `${employee.firstName} ${employee.lastName}`}</DialogTitle>
                        <DialogDescription>
                            {isNew
                                ? 'They\'ll get an email with a temporary password to sign in to Drilld.'
                                : readOnly ? `${employee.email} · you can view, but not change, this employee.` : employee.email}
                        </DialogDescription>
                    </DialogHeader>

                    {!isNew && (
                        <EmployeeStatusActions employee={employee} manager={manager}
                            onResendInvite={onResendInvite}
                            onCancelInvite={async () => { await onCancelInvite(); onClose() }}
                            onSetActive={active => onUpdate({ active })} />
                    )}

                    <FieldGroup className="grid gap-4 sm:grid-cols-2">
                        {text('firstName', 'First name', firstName, setFirstName, { autoFocus: isNew, autoComplete: 'off' })}
                        {text('lastName', 'Last name', lastName, setLastName, { autoComplete: 'off' })}
                        {isNew && text('email', 'Email', email, setEmail, { type: 'email', autoComplete: 'off', placeholder: 'name@yourshop.com' })}
                        {text('phone', 'Phone (optional)', phone, setPhone, { type: 'tel', autoComplete: 'off' })}
                        {text('hireDate', 'Hire date (optional)', hireDate, setHireDate, { type: 'date' })}
                        {showPay && text('hourlyRate', 'Hourly rate (optional)', hourlyRate, setHourlyRate, {
                            type: 'number', inputMode: 'decimal', min: 0, step: 0.01, placeholder: '0.00'
                        })}
                    </FieldGroup>

                    <Field data-invalid={!!errors.access}>
                        <FieldLabel htmlFor="employee-company-role">Company access</FieldLabel>
                        <Select value={companyRole ?? NO_COMPANY_ROLE} disabled={companyRoleLocked}
                            onValueChange={value => { setCompanyRole(value === NO_COMPANY_ROLE ? null : value as CompanyRole); setErrors(prev => ({ ...prev, access: '' })) }}>
                            <SelectTrigger id="employee-company-role" className="sm:w-64"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_COMPANY_ROLE}>None: location roles only</SelectItem>
                                {companyRoleOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}
                                        disabled={option.value === 'OWNER' && manager.companyRole !== 'OWNER'}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FieldDescription>
                            {isSelf ? 'You can\'t change your own company access.' : 'Owners and admins can do everything at every location.'}
                        </FieldDescription>
                    </Field>

                    <Field data-invalid={!!errors.access}>
                        <FieldLabel>Role at each location</FieldLabel>
                        <EmployeeMembershipsInput locations={locations} memberships={memberships} manager={manager} disabled={readOnly}
                            onChange={list => { setMemberships(list); setErrors(prev => ({ ...prev, access: '' })) }} />
                        {errors.access && <FieldError>{errors.access}</FieldError>}
                    </Field>

                    <Field>
                        <FieldLabel>Specialties (optional)</FieldLabel>
                        {readOnly
                            ? <p className="text-sm text-gray-700">{specialties.join(', ') || 'None'}</p>
                            : <EmployeeSpecialtiesInput value={specialties} onChange={setSpecialties} />}
                    </Field>

                    {errors.form && <p role="alert" className="text-sm text-red-700">{errors.form}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
                        {!readOnly && (
                            <Button type="submit" disabled={saving}>
                                {saving ? (isNew ? 'Sending…' : 'Saving…') : isNew ? 'Send invitation' : 'Save'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
