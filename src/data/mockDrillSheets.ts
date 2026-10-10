import { drillSheetSpecSchema, SPEC_SCHEMA_VERSION } from '../../shared/api/drillSheetSpec'
import {
    drillSheetCreateSchema,
    drillSheetDraftSchema,
    drillSheetUpdateSchema,
    type DrillSheetDto,
    type DrillSheetRevisionDto,
    type DrillSheetRevisionSummaryDto
} from '../../shared/api/drillSheets'
import type { DrilledSheetDto } from '../../shared/api/ballLayouts'
import type { DrillSheetsApi } from '../services/drillSheetsService'

// An in-memory stand-in for the drill sheets API, for running without sign-in.
// Follows the same revision rules: drafts are edited in place; once approved,
// saving starts a new draft revision. A revision is "drilled" once a mock
// ball's drilling names it (markMockRevisionDrilled).


const MOCK_USER_ID = 'mock-user'

interface MockSheet {
    sheet: Omit<DrillSheetDto, 'currentRevision'>
    revisions: DrillSheetRevisionDto[]
    currentId: string
}

const MOCK_USER_NAME = 'Mock User'

const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()
const pause = () => new Promise(resolve => setTimeout(resolve, 200))
const clone = <T,>(value: T): T => structuredClone(value)

const revision = (version: number, spec: unknown, overrides: Partial<DrillSheetRevisionDto> = {}): DrillSheetRevisionDto => ({
    id: newId(),
    version,
    locationID: null,
    createdByUserID: MOCK_USER_ID,
    createdByName: MOCK_USER_NAME,
    updatedByUserID: MOCK_USER_ID,
    updatedByName: MOCK_USER_NAME,
    revisionNotes: null,
    approvedByUserID: null,
    approvedByName: null,
    approvedAt: null,
    drilled: false,
    editable: true,
    isCurrent: true,
    discarded: false,
    createdAt: now(),
    updatedAt: now(),
    specSchemaVersion: SPEC_SCHEMA_VERSION,
    spec: drillSheetSpecSchema.parse(spec),
    ...overrides
})

const store = new Map<string, MockSheet>()

// One sample sheet for the first mock customer (a right-hander).
const sampleId = newId()
store.set(sampleId, {
    currentId: '',
    sheet: { id: sampleId, customerID: '1', name: 'Fingertip', gripStyle: 'FINGERTIP', archived: false, createdAt: now(), updatedAt: now() },
    revisions: [revision(1, {
        spans: { thumbToMiddle: { full32: 141, cutToCut32: 136 }, thumbToRing: { full32: 146, cutToCut32: 141 } },
        bridge: { distance32: 8 },
        holes: {
            thumb: {
                size64: 61, outsideDiameter64: 96,
                pitch: { forward32: -12, lateral32: -4 },
                oval: { angleDegrees: 20, pilotHole64: 61, width64: 67 },
                hardware: { gripSizeId: '33244da5-1b49-5ee9-a21e-4861b001308a', manufacturer: 'TURBO', line: 'Switch Grip', kind: 'INTERCHANGEABLE_THUMB', size64: 96, label: 'Outer sleeve', od64: 96, collar: true }
            },
            middle: {
                size64: 50, outsideDiameter64: 62,
                pitch: { forward32: -32, lateral32: -8 },
                insert: { gripSizeId: '53ea5e6e-81f1-5a6a-8322-318a72659d75', manufacturer: 'TURBO', line: 'Quad', size64: 50, label: '7', od64: 62, installStyle: 'Perfect Oval Smooth' },
                vacu: { bit64: 66, depth32: 32 }
            },
            ring: { size64: 42, pitch: { forward32: -24, lateral32: 16 }, fingerOval: { width64: 46 } }
        },
        fitting: { flexibilityDegrees: 95 },
        delivery: { axisTiltDegrees: 12.5, axisRotationDegrees: 45, papOver32: 176, papUp32: 16, speedMph: 17.5, revRateRpm: 350 }
    }, { approvedByUserID: MOCK_USER_ID, approvedByName: MOCK_USER_NAME, approvedAt: now(), editable: false })]
})

// The sample's current revision is its only one.
store.get(sampleId)!.currentId = store.get(sampleId)!.revisions[0].id

/** A revision with its place in the sheet: current, or a discarded draft. */
const withStatus = (entry: MockSheet, revision: DrillSheetRevisionDto): DrillSheetRevisionDto => {
    const isCurrent = revision.id === entry.currentId
    return { ...revision, isCurrent, discarded: !isCurrent && !revision.approvedAt && !revision.drilled }
}

const currentOf = (entry: MockSheet) => entry.revisions.find(r => r.id === entry.currentId)

const toDto = (entry: MockSheet): DrillSheetDto => {
    const current = currentOf(entry)
    return clone({ ...entry.sheet, currentRevision: current ? withStatus(entry, current) : null })
}

const find = (id: string): MockSheet => {
    const entry = store.get(id)
    if (!entry) throw new Error('Drill sheet not found')
    return entry
}

const toSummary = (revision: DrillSheetRevisionDto): DrillSheetRevisionSummaryDto => {
    const summary: Partial<DrillSheetRevisionDto> = { ...revision }
    delete summary.spec
    delete summary.specSchemaVersion
    return summary as DrillSheetRevisionSummaryDto
}

const findRevision = (id: string, version: number): DrillSheetRevisionDto => {
    const found = find(id).revisions.find(r => r.version === version)
    if (!found) throw new Error('Revision not found')
    return found
}

/** A mock ball's drilling names this revision: it's drilled now (locked). Returns the sheet it belongs to. */
export const markMockRevisionDrilled = (revisionId: string): DrilledSheetDto | null => {
    for (const entry of store.values()) {
        const found = entry.revisions.find(r => r.id === revisionId)
        if (!found) continue
        Object.assign(found, { drilled: true, editable: false })
        return { sheetId: entry.sheet.id, name: entry.sheet.name, gripStyle: entry.sheet.gripStyle, revisionId, version: found.version }
    }
    return null
}

export const mockDrillSheetsApi: DrillSheetsApi = {
    async list(customerId, options = {}) {
        await pause()
        return [...store.values()]
            .filter(entry => entry.sheet.customerID === customerId && (options.archived || !entry.sheet.archived))
            .sort((a, b) => b.sheet.updatedAt.localeCompare(a.sheet.updatedAt))
            .map(toDto)
    },

    async create(customerId, input) {
        await pause()
        const parsed = drillSheetCreateSchema.parse(input)
        const id = newId()
        const first = revision(1, parsed.spec, { locationID: parsed.locationID, revisionNotes: parsed.revisionNotes })
        store.set(id, {
            sheet: { id, customerID: customerId, name: parsed.name, gripStyle: parsed.gripStyle, archived: false, createdAt: now(), updatedAt: now() },
            revisions: [first],
            currentId: first.id
        })
        return toDto(find(id))
    },

    async get(id) {
        await pause()
        return toDto(find(id))
    },

    async update(id, changes) {
        await pause()
        const parsed = drillSheetUpdateSchema.parse(changes)
        const entry = find(id)
        if (parsed.name !== undefined) entry.sheet.name = parsed.name
        if (parsed.gripStyle !== undefined) entry.sheet.gripStyle = parsed.gripStyle
        if (parsed.archived !== undefined) entry.sheet.archived = parsed.archived
        entry.sheet.updatedAt = now()
        return toDto(entry)
    },

    async saveDraft(id, draft) {
        await pause()
        const parsed = drillSheetDraftSchema.parse(draft)
        const entry = find(id)
        if (entry.sheet.archived) throw new Error('This drill sheet is archived')
        const current = currentOf(entry)
        if (parsed.basedOnRevisionID && parsed.basedOnRevisionID !== current?.id) {
            throw new Error('Someone else saved this drill sheet meanwhile. Reload it and try again.')
        }
        const content = {
            spec: parsed.spec,
            revisionNotes: parsed.revisionNotes,
            locationID: parsed.locationID ?? current?.locationID ?? null
        }
        if (current?.editable) {
            Object.assign(current, content, { updatedAt: now(), updatedByUserID: MOCK_USER_ID, updatedByName: MOCK_USER_NAME })
        } else {
            const next = revision(Math.max(...entry.revisions.map(r => r.version)) + 1, parsed.spec, content)
            entry.revisions.push(next)
            entry.currentId = next.id
        }
        entry.sheet.updatedAt = now()
        return toDto(entry)
    },

    async discardDraft(id) {
        await pause()
        const entry = find(id)
        const current = currentOf(entry)
        if (!current?.editable) throw new Error('Only a draft can be discarded; this revision is approved or drilled')
        const previous = entry.revisions
            .filter(r => r.version < current.version && (r.approvedAt || r.drilled))
            .sort((a, b) => b.version - a.version)[0]
        if (!previous) throw new Error('There is no earlier revision to go back to')
        entry.currentId = previous.id
        entry.sheet.updatedAt = now()
        return toDto(entry)
    },

    async revisions(id) {
        await pause()
        const entry = find(id)
        return clone(entry.revisions.slice().sort((a, b) => b.version - a.version).map(r => toSummary(withStatus(entry, r))))
    },

    async revision(id, version) {
        await pause()
        return clone(withStatus(find(id), findRevision(id, version)))
    },

    async approve(id, version) {
        await pause()
        const found = findRevision(id, version)
        if (found.approvedAt) throw new Error('This revision is already approved')
        Object.assign(found, { approvedAt: now(), approvedByUserID: MOCK_USER_ID, approvedByName: MOCK_USER_NAME, editable: false, updatedAt: now() })
        return clone(withStatus(find(id), found))
    }
}
