import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { canDeactivateEmployee, canEditEmployee, type EmployeeManager } from '../../../shared/api/employees'
import type { Employee } from '../../types'

interface EmployeeStatusActionsProps {
    employee: Employee
    manager: EmployeeManager
    onResendInvite: () => Promise<void>
    onCancelInvite: () => Promise<void>
    onSetActive: (active: boolean) => Promise<void>
}

type Pending = 'resend' | 'cancel' | 'deactivate' | 'reactivate'

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })

/**
 * Sign-in status and what can be done about it: resend or cancel an
 * invitation, deactivate (blocks sign-in) or reactivate. Removing someone
 * asks for a second tap.
 */
export const EmployeeStatusActions = ({ employee, manager, onResendInvite, onCancelInvite, onSetActive }: EmployeeStatusActionsProps) => {
    const [confirming, setConfirming] = useState<'cancel' | 'deactivate' | null>(null)
    const [busy, setBusy] = useState<Pending | null>(null)
    const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
    const canEdit = canEditEmployee(manager, employee)
    const canDeactivate = canDeactivateEmployee(manager, employee)

    const run = async (action: Pending, work: () => Promise<void>, done?: string) => {
        setBusy(action)
        setMessage(null)
        try {
            await work()
            setConfirming(null)
            if (done) setMessage({ text: done })
        } catch (err) {
            setMessage({ text: (err as Error).message, error: true })
        } finally {
            setBusy(null)
        }
    }

    const summary = employee.status === 'INVITED'
        ? `Invited${employee.invitedAt ? ` ${when(employee.invitedAt)}` : ''}; hasn't signed in yet.`
        : employee.status === 'INACTIVE' ? 'Deactivated: can\'t sign in.' : 'Signed in to Drilld.'

    return (
        <div className="grid gap-2 rounded-lg border border-border bg-gray-50 p-3">
            <p className="text-sm text-gray-700">{summary}</p>
            <div className="flex flex-wrap gap-2">
                {employee.status === 'INVITED' && canEdit && (
                    <Button type="button" variant="outline" size="sm" disabled={busy !== null}
                        onClick={() => run('resend', onResendInvite, `Sent a new invitation to ${employee.email}.`)}>
                        {busy === 'resend' ? 'Sending…' : 'Resend invitation'}
                    </Button>
                )}
                {employee.status === 'INVITED' && canDeactivate && (
                    confirming === 'cancel' ? (
                        <Button type="button" variant="destructive" size="sm" disabled={busy !== null} onClick={() => run('cancel', onCancelInvite)}>
                            {busy === 'cancel' ? 'Removing…' : 'Yes, cancel and remove'}
                        </Button>
                    ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming('cancel')}>Cancel invitation</Button>
                    )
                )}
                {employee.active && employee.status !== 'INVITED' && canDeactivate && (
                    confirming === 'deactivate' ? (
                        <Button type="button" variant="destructive" size="sm" disabled={busy !== null} onClick={() => run('deactivate', () => onSetActive(false))}>
                            {busy === 'deactivate' ? 'Deactivating…' : 'Yes, deactivate'}
                        </Button>
                    ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming('deactivate')}>Deactivate</Button>
                    )
                )}
                {!employee.active && canDeactivate && (
                    <Button type="button" variant="outline" size="sm" disabled={busy !== null} onClick={() => run('reactivate', () => onSetActive(true))}>
                        {busy === 'reactivate' ? 'Reactivating…' : 'Reactivate'}
                    </Button>
                )}
            </div>
            {confirming === 'deactivate' && (
                <p className="text-sm text-gray-600">They won't be able to sign in. Their name stays on the work they did.</p>
            )}
            {confirming === 'cancel' && (
                <p className="text-sm text-gray-600">Removes {employee.firstName} and their invitation, e.g. to fix a typo in the email.</p>
            )}
            {message && <p role={message.error ? 'alert' : 'status'} className={message.error ? 'text-sm text-red-700' : 'text-sm text-green-800'}>{message.text}</p>}
        </div>
    )
}
