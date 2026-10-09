import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocationEquipment } from '../../hooks/useLocationEquipment'
import { EquipmentDetail } from './EquipmentDetail'
import { EquipmentDialog } from './EquipmentDialog'
import { EquipmentList } from './EquipmentList'

interface LocationEquipmentProps {
    locationId: string
    canManage: boolean
    canDo: boolean
    /** The location's equipment, when the page already has it (so its counts stay in step). */
    list?: ReturnType<typeof useLocationEquipment>
}

/** A location's equipment: add machines, open one for its maintenance and history. */
export const LocationEquipment = ({ locationId, canManage, canDo, list: shared }: LocationEquipmentProps) => {
    const own = useLocationEquipment(shared ? undefined : locationId)
    const list = shared ?? own
    const [openId, setOpenId] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)

    if (openId) {
        return <EquipmentDetail id={openId} canManage={canManage} canDo={canDo} onChange={list.replace} onBack={() => setOpenId(null)} />
    }

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-600">Machines at this location and their scheduled maintenance.</p>
                {canManage && <Button onClick={() => setAdding(true)}><Plus data-icon="inline-start" /> Add equipment</Button>}
            </div>
            {list.error && <p role="alert" className="text-sm text-red-700">{list.error}</p>}
            {list.loading ? (
                <p className="py-6 text-center text-gray-500">Loading equipment…</p>
            ) : list.equipment.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">No equipment yet.{canManage ? ' Add your drill press to get its maintenance schedule.' : ''}</p>
            ) : (
                <EquipmentList equipment={list.equipment} onOpen={setOpenId} />
            )}
            {adding && (
                <EquipmentDialog machine={null} onClose={() => setAdding(false)}
                    onSave={async input => { const created = await list.add(input); setOpenId(created.id) }} />
            )}
        </div>
    )
}
