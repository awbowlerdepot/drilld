import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { DrillSheetDto } from '../../../shared/api/drillSheets'
import type { Customer } from '../../types'
import { DrillSheetListItem } from './DrillSheetListItem'
import { NewDrillSheetDialog } from './NewDrillSheetDialog'
import type { useCustomerDrillSheets } from '../../hooks/useCustomerDrillSheets'

interface CustomerDrillSheetsProps {
    customer: Customer
    drillSheets: ReturnType<typeof useCustomerDrillSheets>
    includeArchived: boolean
    onIncludeArchivedChange: (include: boolean) => void
    onOpen: (sheet: DrillSheetDto) => void
    creating: boolean
    onCreatingChange: (creating: boolean) => void
}

/** A customer's drill sheets: open one, start a new one, archive old ones. */
export const CustomerDrillSheets = ({
    customer, drillSheets, includeArchived, onIncludeArchivedChange, onOpen, creating, onCreatingChange
}: CustomerDrillSheetsProps) => {
    const { sheets, loading, error, createSheet, setArchived } = drillSheets
    const [actionError, setActionError] = useState<string | null>(null)

    const handleSetArchived = async (sheet: DrillSheetDto, archived: boolean) => {
        try {
            await setArchived(sheet.id, archived)
            setActionError(null)
        } catch (err) {
            setActionError((err as Error).message)
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-medium text-gray-900">Drill sheets for {customer.firstName}</h3>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <Switch checked={includeArchived} onCheckedChange={onIncludeArchivedChange} />
                        Show archived
                    </label>
                    <Button onClick={() => onCreatingChange(true)}><Plus data-icon="inline-start" /> New drill sheet</Button>
                </div>
            </div>

            {(error || actionError) && <p role="alert" className="text-sm text-red-700">{error ?? actionError}</p>}

            {loading ? (
                <p className="py-8 text-center text-gray-500">Loading drill sheets…</p>
            ) : sheets.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
                    <FileText className="mx-auto mb-4 size-12 text-gray-400" />
                    <h4 className="mb-2 text-lg font-medium text-gray-900">No drill sheets yet</h4>
                    <p className="mb-6 text-gray-500">Create {customer.firstName}'s first drill sheet to record the fit.</p>
                    <Button onClick={() => onCreatingChange(true)}><Plus data-icon="inline-start" /> New drill sheet</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sheets.map(sheet => (
                        <DrillSheetListItem key={sheet.id} sheet={sheet}
                            onOpen={onOpen} onSetArchived={handleSetArchived} />
                    ))}
                </div>
            )}

            {creating && (
                <NewDrillSheetDialog customer={customer} onClose={() => onCreatingChange(false)}
                    onCreate={async sheet => {
                        const created = await createSheet(sheet)
                        onCreatingChange(false)
                        onOpen(created)
                    }} />
            )}
        </div>
    )
}
