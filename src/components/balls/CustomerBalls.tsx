import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { useCompanyBalls } from '../../hooks/useCompanyBalls'
import type { Customer } from '../../types'
import { BallDetailDialog } from './BallDetailDialog'
import { BallTable } from './BallTable'
import { RegisterBallDialog } from './RegisterBallDialog'

interface CustomerBallsProps {
    customer: Customer
    customers: Customer[]
    balls: ReturnType<typeof useCompanyBalls>
    /** Open the add dialog straight away (from the overview's "Add ball"). */
    adding: boolean
    onAddingChange: (adding: boolean) => void
}

/** A bowler's balls (the ones they own now): add one from the catalog, open one for its specs and history. */
export const CustomerBalls = ({ customer, customers, balls, adding, onAddingChange }: CustomerBallsProps) => {
    const [openId, setOpenId] = useState<string | null>(null)
    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-600">{customer.firstName}'s balls, from the BowlerIQ catalog.</p>
                <Button onClick={() => onAddingChange(true)}><Plus data-icon="inline-start" /> Add ball</Button>
            </div>
            {balls.error && <p role="alert" className="text-sm text-red-700">{balls.error}</p>}
            {balls.loading ? <p className="py-6 text-center text-gray-500">Loading balls…</p>
                : balls.balls.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">No balls yet.</p>
                    : <BallTable balls={balls.balls} showOwner={false} onOpen={ball => setOpenId(ball.id)} />}
            {adding && (
                <RegisterBallDialog customer={customer} customers={customers} onClose={() => onAddingChange(false)}
                    onRegister={async input => { await balls.register(input) }} />
            )}
            {openId && <BallDetailDialog ballId={openId} customers={customers} canEdit onChange={balls.replace} onClose={() => setOpenId(null)} />}
        </div>
    )
}
