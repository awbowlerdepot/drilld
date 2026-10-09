import { Badge } from '@/components/ui/badge'
import type { BallDto } from '../../../shared/api/balls'
import { formatInches } from '../../utils/BallFormat'
import { BallImage } from './BallImage'

interface BallTableProps {
    balls: BallDto[]
    /** Show the owner column (the company list; not a bowler's own). */
    showOwner: boolean
    onOpen: (ball: BallDto) => void
}

const STATUS = { ACTIVE: null, RETIRED: 'Retired', DAMAGED: 'Damaged' } as const

/** Balls: what, weight, serial, pin, owner, status. Tap a row to open it. */
export const BallTable = ({ balls, showOwner, onOpen }: BallTableProps) => (
    <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-border bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                    <th scope="col" className="px-3 py-2.5">Ball</th>
                    <th scope="col" className="px-3 py-2.5">Weight</th>
                    <th scope="col" className="px-3 py-2.5">Serial</th>
                    <th scope="col" className="px-3 py-2.5">Pin</th>
                    {showOwner && <th scope="col" className="px-3 py-2.5">Owner</th>}
                </tr>
            </thead>
            <tbody>
                {balls.map(ball => (
                    <tr key={ball.id} onClick={() => onOpen(ball)} className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-blue-50/40">
                        <td className="px-3 py-2">
                            <div className="flex items-center gap-3">
                            <BallImage ball={ball.catalogBall} size="sm" />
                            <div className="min-w-0">
                            <button type="button" onClick={event => { event.stopPropagation(); onOpen(ball) }}
                                className="text-left font-medium text-gray-900 hover:text-primary hover:underline">
                                {ball.catalogBall.brandName} {ball.catalogBall.name}
                            </button>
                            {STATUS[ball.status] && <Badge variant="outline" className="ml-2 font-normal">{STATUS[ball.status]}</Badge>}
                            <span className="block text-xs text-gray-500">{ball.catalogBall.color}</span>
                            </div>
                            </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono">{ball.weightLbs} lb</td>
                        <td className="px-3 py-2.5 font-mono text-gray-700">{ball.serialNumber ?? '—'}</td>
                        <td className="px-3 py-2.5 font-mono text-gray-700">{formatInches(ball.pinDistance)}</td>
                        {showOwner && <td className="px-3 py-2.5 text-gray-700">{ball.owner?.name ?? '—'}</td>}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)
