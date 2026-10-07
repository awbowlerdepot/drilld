import { drillSheetSpecSchema, SPEC_SCHEMA_VERSION } from '../../shared/api/drillSheetSpec'
import {
    drillSheetCreateSchema,
    drillSheetDraftSchema,
    drillSheetUpdateSchema,
    type DrillSheetDto,
    type DrillSheetRevisionDto,
    type DrillSheetRevisionSummaryDto
} from '../../shared/api/drillSheets'
import type { DrillSheetsApi } from '../services/drillSheetsService'

// An in-memory stand-in for the drill sheets API, for running without sign-in.
// Follows the same revision rules: drafts are edited in place; once approved,
// saving starts a new draft revision. (There are no work orders here, so
// nothing is ever "drilled".)

const MOCK_USER_ID = 'mock-user'

interface MockSheet {
    sheet: Omit<DrillSheetDto, 'currentRevision'>
    revisions: DrillSheetRevisionDto[]
}

const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()
const pause = () => new Promise(resolve => setTimeout(resolve, 200))
const clone = <T,>(value: T): T => structuredClone(value)

const revision = (version: number, spec: unknown, overrides: Partial<DrillSheetRevisionDto> = {}): DrillSheetRevisionDto => ({
    id: newId(),
    version,
    locationID: null,
    createdByUserID: MOCK_USER_ID,
    revisionNotes: null,
    approvedByUserID: null,
    approvedAt: null,
    drilled: false,
    editable: true,
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
    sheet: { id: sampleId, customerID: '1', name: 'Fingertip', gripStyle: 'FINGERTIP', archived: false, createdAt: now(), updatedAt: now() },
    revisions: [revision(1, {
        spans: { thumbToMiddle: { full32: 141, cutToCut32: 136 }, thumbToRing: { full32: 146, cutToCut32: 141 } },
        bridge: { distance32: 8 },
        holes: {
            thumb: {
                size64: 61, outsideDiameter64: 96,
                pitch: { forward32: -12, lateral32: -4 },
                oval: { angleDegrees: 20, pilotHole64: 61, width64: 67 },
                slug: { manufacturer: 'Turbo', type: 'Switch Grip', interchangeable: true }
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
    }, { approvedByUserID: MOCK_USER_ID, approvedAt: now(), editable: false })]
})

const toDto = ({ sheet, revisions }: MockSheet): DrillSheetDto =>
    clone({ ...sheet, currentRevision: revisions[revisions.length - 1] ?? null })

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
        store.set(id, {
            sheet: { id, customerID: customerId, name: parsed.name, gripStyle: parsed.gripStyle, archived: false, createdAt: now(), updatedAt: now() },
            revisions: [revision(1, parsed.spec, { locationID: parsed.locationID, revisionNotes: parsed.revisionNotes })]
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
        const current = entry.revisions[entry.revisions.length - 1]
        if (parsed.basedOnRevisionID && parsed.basedOnRevisionID !== current?.id) {
            throw new Error('Someone else saved this drill sheet meanwhile. Reload it and try again.')
        }
        const content = {
            spec: parsed.spec,
            revisionNotes: parsed.revisionNotes,
            locationID: parsed.locationID ?? current?.locationID ?? null
        }
        if (current?.editable) {
            Object.assign(current, content, { updatedAt: now() })
        } else {
            entry.revisions.push(revision((current?.version ?? 0) + 1, parsed.spec, content))
        }
        entry.sheet.updatedAt = now()
        return toDto(entry)
    },

    async revisions(id) {
        await pause()
        return clone(find(id).revisions.slice().reverse().map(toSummary))
    },

    async revision(id, version) {
        await pause()
        return clone(findRevision(id, version))
    },

    async approve(id, version) {
        await pause()
        const found = findRevision(id, version)
        if (found.approvedAt) throw new Error('This revision is already approved')
        Object.assign(found, { approvedAt: now(), approvedByUserID: MOCK_USER_ID, editable: false, updatedAt: now() })
        return clone(found)
    }
}
