import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TwoFactorSetupDialog } from '../auth/TwoFactorSetupDialog'

interface TwoFactorRequiredProps {
    email: string
    onReady: () => Promise<void>
}

/** Shown to a platform admin without two-factor sign-in: set it up to continue. */
export const TwoFactorRequired = ({ email, onReady }: TwoFactorRequiredProps) => {
    const [open, setOpen] = useState(false)
    return (
        <Card className="mx-auto max-w-xl">
            <CardHeader>
                <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
                <CardTitle>Set up two-factor sign-in</CardTitle>
                <CardDescription>
                    Platform admin tools, like leads, need an authenticator app (Google Authenticator, 1Password, Authy or similar).
                    It takes about a minute, and you'll enter a code from the app each time you sign in.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => setOpen(true)}>Set up an authenticator app</Button>
            </CardContent>
            {open && <TwoFactorSetupDialog email={email} onClose={() => setOpen(false)} onDone={async () => { setOpen(false); await onReady() }} />}
        </Card>
    )
}
