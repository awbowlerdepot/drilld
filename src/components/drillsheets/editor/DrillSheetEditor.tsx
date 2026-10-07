import { useState } from 'react'
import { ArrowLeft, Drill, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCompanySettings } from '../../../hooks/useCompanySettings'
import { useDrillSheetEditor } from '../../../hooks/useDrillSheetEditor'
import { useLocations } from '../../../hooks/useLocations'
import type { Customer } from '../../../types'
import { resolveLocationSettings } from '../../../utils/LocationSettings'
import { DrillPressView } from '../press/DrillPressView'
import { DeliveryPanel } from './DeliveryPanel'
import { FingerHoleCard } from './FingerHoleCard'
import { FitPanel } from './FitPanel'
import { HoleLayout } from './HoleLayout'
import { NotesPanel } from './NotesPanel'
import { PickerHost } from './PickerHost'
import { RevisionHistoryDialog } from './RevisionHistoryDialog'
import { ThumbHoleCard } from './ThumbHoleCard'
import { fingersBySide, type SheetEditProps } from './editorTypes'

interface DrillSheetEditorProps {
    sheetId: string
    customer: Customer
    /** Where the fitting is happening; recorded on the revision. */
    locationID?: string
    onBack: () => void
}

/**
 * The drill sheet editor (canvas design D): the familiar hole layout with every
 * value tappable, then each hole's details, the fit, the delivery and notes.
 * Edits stay local until saved; saving an approved or drilled revision starts
 * a new draft revision.
 */
export const DrillSheetEditor = ({ sheetId, customer, locationID, onBack }: DrillSheetEditorProps) => {
    const { sheet, spec, dirty, loading, saving, error, edit, save, approve, discard, discardDraft } = useDrillSheetEditor(sheetId, locationID)
    const { settings } = useCompanySettings()
    const { locations } = useLocations()
    const location = locations.find(l => l.id === locationID)
    const drillSheetSettings = resolveLocationSettings(settings, location?.settingsOverrides).drillSheets
    const [pressView, setPressView] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)

    if (loading) return <p className="py-12 text-center text-gray-500">Loading drill sheet…</p>
    if (!sheet || !spec) {
        return (
            <div className="space-y-4 py-12 text-center">
                <p className="text-gray-700">{error ?? 'This drill sheet has no revisions yet.'}</p>
                <Button variant="outline" onClick={onBack}>Back</Button>
            </div>
        )
    }

    const revision = sheet.currentRevision

    // The press works from the saved revision, never from unsaved edits.
    if (pressView && revision) {
        return <DrillPressView sheet={sheet} spec={revision.spec} customer={customer} press={drillSheetSettings} standardBevel={drillSheetSettings.standardBevel} holeDepths={drillSheetSettings.holeDepths} onExit={() => setPressView(false)} />
    }
    const locked = revision ? !revision.editable : false
    const hand = customer.dominantHand
    const sides = fingersBySide(hand)
    const editProps: SheetEditProps = { spec, edit, readOnly: sheet.archived, hand, locationId: locationID }
    const status = !revision ? null
        : revision.drilled ? { label: `Drilled · Revision ${revision.version}`, className: 'bg-gray-100 text-gray-700' }
            : revision.approvedAt ? { label: `Approved · Revision ${revision.version}`, className: 'bg-green-100 text-green-800' }
                : { label: `Draft · Revision ${revision.version}`, className: 'bg-amber-100 text-amber-900' }

    return (
        <PickerHost>
            <div className="mx-auto flex max-w-[1180px] flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft data-icon="inline-start" /> {customer.firstName} {customer.lastName}
                    </Button>
                </div>

                <section className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold">{sheet.name}</h1>
                    {status && <Badge className={status.className}>{status.label}</Badge>}
                    {sheet.archived && <Badge variant="outline">Archived</Badge>}
                    <span className="text-sm text-gray-600">
                        {sheet.archived ? 'Archived sheets are read-only'
                            : dirty ? (locked ? `Unsaved: saving starts revision ${(revision?.version ?? 0) + 1}` : 'Unsaved changes')
                                : 'Tap any value to set it'}
                    </span>
                    {!sheet.archived && (
                        <div className="ml-auto flex flex-wrap gap-2">
                            {revision && (
                                <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                                    <History data-icon="inline-start" /> History
                                </Button>
                            )}
                            {revision && (
                                <Button variant="outline" disabled={saving} onClick={() => setPressView(true)}
                                    title={dirty ? 'Shows the saved revision, not unsaved changes' : undefined}>
                                    <Drill data-icon="inline-start" /> Drill press
                                </Button>
                            )}
                            {dirty && <Button variant="ghost" disabled={saving} onClick={discard}>Discard changes</Button>}
                            {!dirty && revision?.editable && revision.version > 1 && (
                                <Button variant="ghost" className="text-destructive" disabled={saving}
                                    title={`Go back to the revision this draft started from. Revision ${revision.version} stays in the history.`}
                                    onClick={() => {
                                        if (window.confirm(`Discard draft revision ${revision.version} and go back to the revision it started from?`)) discardDraft()
                                    }}>
                                    Discard revision {revision.version}
                                </Button>
                            )}
                            <Button variant="outline" disabled={!dirty || saving} onClick={() => save()}>
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                            {revision && !revision.approvedAt && (
                                <Button disabled={saving} onClick={() => approve()}>
                                    {dirty ? 'Save and approve' : `Approve revision ${revision.version}`}
                                </Button>
                            )}
                        </div>
                    )}
                </section>

                {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>}

                <section aria-label="Drill sheet" className="rounded-xl border border-border bg-white p-6">
                    <HoleLayout {...editProps} />
                </section>

                <section aria-label="Hole details" className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-4">
                    <FingerHoleCard {...editProps} finger={sides.left} side="LEFT" press={drillSheetSettings}
                        standardBevel={drillSheetSettings.standardBevel} gripStyle={sheet.gripStyle} holeDepths={drillSheetSettings.holeDepths} />
                    <ThumbHoleCard {...editProps} press={drillSheetSettings}
                        standardBevel={drillSheetSettings.standardBevel} holeDepths={drillSheetSettings.holeDepths} />
                    <FingerHoleCard {...editProps} finger={sides.right} side="RIGHT" press={drillSheetSettings}
                        standardBevel={drillSheetSettings.standardBevel} gripStyle={sheet.gripStyle} holeDepths={drillSheetSettings.holeDepths} />
                </section>

                <section aria-label="Fit and delivery" className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-start gap-4">
                    <FitPanel {...editProps} showClt={drillSheetSettings.enableClt} />
                    <DeliveryPanel {...editProps} customerName={customer.firstName} customerDelivery={customer.delivery} />
                </section>

                <NotesPanel {...editProps} />

                {historyOpen && <RevisionHistoryDialog sheetId={sheet.id} sheetName={sheet.name} onClose={() => setHistoryOpen(false)} />}
            </div>
        </PickerHost>
    )
}
