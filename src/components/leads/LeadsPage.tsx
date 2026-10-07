import type { MeDto } from '../../../shared/api/me'
import { LeadsBoard } from './LeadsBoard'
import { TwoFactorRequired } from './TwoFactorRequired'

interface LeadsPageProps {
    searchTerm: string
    platformAdmin: NonNullable<MeDto['user']['platformAdmin']>
    email: string
    /** Called once two-factor sign-in is set up, to re-read the user's status. */
    onTwoFactorReady: () => Promise<void>
}

/**
 * Early access signups from drilld.io, for platform admins. Platform admin
 * tools need two-factor sign-in first.
 */
export const LeadsPage = ({ searchTerm, platformAdmin, email, onTwoFactorReady }: LeadsPageProps) =>
    platformAdmin === 'ACTIVE'
        ? <LeadsBoard searchTerm={searchTerm} />
        : <TwoFactorRequired email={email} onReady={onTwoFactorReady} />
