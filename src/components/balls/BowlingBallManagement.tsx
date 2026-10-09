import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { BallStatus, CatalogStatusDto } from '../../../shared/api/balls'
import { ballsApi, useCompanyBalls } from '../../hooks/useCompanyBalls'
import { useCustomers } from '../../hooks/useCustomers'
import { BallDetailDialog } from './BallDetailDialog'
import { BallTable } from './BallTable'
import { RegisterBallDialog } from './RegisterBallDialog'

interface BowlingBallManagementProps {
    searchTerm: string
}

type Filter = BallStatus | 'ALL'

/** Every ball the company has on record, with their owners; search, filter by status, add one. */
export const BowlingBallManagement = ({ searchTerm }: BowlingBallManagementProps) => {
    const balls = useCompanyBalls()
    const { customers } = useCustomers()
    const [filter, setFilter] = useState<Filter>('ACTIVE')
    const [openId, setOpenId] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)
    const [catalog, setCatalog] = useState<CatalogStatusDto | null>(null)

    useEffect(() => { ballsApi.catalogStatus().then(setCatalog).catch(() => undefined) }, [])

    const term = searchTerm.trim().toLowerCase()
    const shown = balls.balls
        .filter(b => filter === 'ALL' || b.status === filter)
        .filter(b => !term || [b.catalogBall.brandName, b.catalogBall.name, b.catalogBall.color, b.serialNumber, b.owner?.name]
            .some(v => v?.toLowerCase().includes(term)))

    const chip = (key: Filter, label: string) => (
        <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}
            className={cn('min-h-9 rounded-full border px-3 text-sm font-medium transition-colors',
                filter === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-gray-700 hover:bg-muted')}>
            {label} <span className={filter === key ? 'opacity-80' : 'text-gray-500'}>{key === 'ALL' ? balls.balls.length : balls.balls.filter(b => b.status === key).length}</span>
        </button>
    )

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bowling Balls</h1>
                    <p className="text-gray-600">
                        Every bowler's balls on record.
                        {catalog && ` Catalog: ${catalog.ballCount.toLocaleString()} balls from BowlerIQ${catalog.lastRunAt ? `, updated ${new Date(catalog.lastRunAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : ''}.`}
                    </p>
                </div>
                <Button onClick={() => setAdding(true)}><Plus data-icon="inline-start" /> Add ball</Button>
            </div>
            <div className="flex flex-wrap gap-2">
                {chip('ACTIVE', 'Active')}
                {chip('RETIRED', 'Retired')}
                {chip('DAMAGED', 'Damaged')}
                {chip('ALL', 'All')}
            </div>
            {balls.error && <p role="alert" className="text-sm text-red-700">{balls.error}</p>}
            {balls.loading ? <p className="py-8 text-center text-gray-500">Loading balls…</p>
                : shown.length === 0 ? <p className="py-8 text-center text-gray-500">{balls.balls.length === 0 ? 'No balls on record yet.' : 'No balls match.'}</p>
                    : <BallTable balls={shown} showOwner onOpen={ball => setOpenId(ball.id)} />}
            {adding && <RegisterBallDialog customer={null} customers={customers} onClose={() => setAdding(false)} onRegister={async input => { await balls.register(input) }} />}
            {openId && <BallDetailDialog ballId={openId} customers={customers} canEdit onChange={balls.replace} onClose={() => setOpenId(null)} />}
        </div>
    )
}
