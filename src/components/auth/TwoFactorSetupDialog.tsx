import { useEffect, useState } from 'react'
import { setUpTOTP, updateMFAPreference, verifyTOTPSetup } from 'aws-amplify/auth'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface TwoFactorSetupDialogProps {
    email: string
    onClose: () => void
    onDone: () => Promise<void>
}

/**
 * Turns on TOTP for the signed-in user: scan the code (or type the key) into
 * an authenticator app, then enter a code from it. After this, Cognito asks
 * for a code at every sign-in.
 */
export const TwoFactorSetupDialog = ({ email, onClose, onDone }: TwoFactorSetupDialogProps) => {
    const [secret, setSecret] = useState<string | null>(null)
    const [qr, setQr] = useState<string | null>(null)
    const [code, setCode] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        let cancelled = false
        setUpTOTP()
            .then(async details => {
                if (cancelled) return
                setSecret(details.sharedSecret)
                setQr(await QRCode.toDataURL(details.getSetupUri('Drilld', email).toString(), { margin: 1, width: 200 }))
            })
            .catch((err: Error) => { if (!cancelled) setError(err.message) })
        return () => { cancelled = true }
    }, [email])

    const verify = async () => {
        setBusy(true)
        setError(null)
        try {
            await verifyTOTPSetup({ code: code.trim() })
            await updateMFAPreference({ totp: 'PREFERRED' })
            await onDone()
        } catch (err) {
            setError((err as Error).message || 'That code didn\'t work. Try the newest one.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open onOpenChange={open => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Two-factor sign-in</DialogTitle>
                    <DialogDescription>Scan this with your authenticator app, then enter the 6-digit code it shows.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-3">
                    {qr ? <img src={qr} alt="QR code for your authenticator app" className="size-48 rounded-lg border border-border" />
                        : <div className="size-48 animate-pulse rounded-lg bg-gray-100" />}
                    {secret && (
                        <p className="text-center text-xs text-gray-500">
                            Can't scan? Enter this key instead:
                            <span className="mt-1 block break-all font-mono text-sm text-gray-900">{secret}</span>
                        </p>
                    )}
                </div>

                <form onSubmit={event => { event.preventDefault(); void verify() }}>
                    <Field data-invalid={!!error}>
                        <FieldLabel htmlFor="totp-code">Code from the app</FieldLabel>
                        <Input id="totp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                            value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} />
                        {error && <FieldError>{error}</FieldError>}
                    </Field>
                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={code.length !== 6 || busy || !secret}>{busy ? 'Checking…' : 'Turn on'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
