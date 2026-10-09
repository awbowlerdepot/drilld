import { ballRegisterSchema, ballUpdateSchema, type BallDetailDto, type CatalogBallDto, type ShopBallModel } from '../../shared/api/balls'
import type { BallsApi } from '../services/ballsService'
import { mockCustomers } from './mockData'

// The ball catalog and a company's balls without sign-in: a few catalog balls
// standing in for the BowlerIQ catalog, and balls kept in memory, following
// the API's rules (amplify/api/routes/balls.ts).

const brand = (name: string) => ({ id: `00000000-0000-4000-8000-0000000000${name === 'Storm' ? 'b1' : name === 'Motiv' ? 'b2' : 'b3'}`, name })
const weights = (rg: number, diff: number, mb: number | null) => [16, 15, 14, 13, 12].map((weightLbs, i) => ({
    weightLbs, rg: Math.round((rg + i * 0.01) * 1000) / 1000, differential: Math.round((diff - i * 0.002) * 1000) / 1000, massBias: mb
}))
const ball = (n: number, brandName: string, name: string, color: string, cover: string, core: string, coreType: string, status: 'current' | 'retired', w: ReturnType<typeof weights>): CatalogBallDto => ({
    id: `00000000-0000-4000-8000-0000000c00${String(n).padStart(2, '0')}`, source: 'catalog', brandId: brand(brandName).id, brandName, name, color, status,
    releaseDate: null, imageUrl: null, coverstock: { name: cover, material: 'reactive_resin', type: 'solid' }, core: { name: core, type: coreType },
    finish: '1500 Grit Polished', weights: w, removed: false
})

export const mockCatalog: CatalogBallDto[] = [
    ball(1, 'Storm', 'Phaze II', 'Pitch Purple', 'TX-16 Solid', 'Velocity', 'symmetric', 'current', weights(2.48, 0.051, null)),
    ball(2, 'Storm', 'Phaze II', 'Black / Teal', 'TX-16 Solid', 'Velocity', 'symmetric', 'current', weights(2.48, 0.051, null)),
    ball(3, 'Storm', 'IQ Tour', 'Rose / Black', 'R2S Pearl', 'C3 Centripetal', 'symmetric', 'current', weights(2.56, 0.034, null)),
    ball(4, 'Motiv', 'Jackal Ghost', 'Black / Red', 'Coercion HFS', 'Predator V2', 'asymmetric', 'current', weights(2.47, 0.054, 0.019)),
    ball(5, 'Motiv', 'Venom Shock', 'Teal / Black', 'Turmoil MFS', 'Gear', 'symmetric', 'retired', weights(2.50, 0.035, null)),
    ball(6, 'Hammer', 'Black Widow 3.0', 'Black / Red', 'HK22 Hybrid', 'Black Widow 3.0', 'asymmetric', 'current', weights(2.49, 0.058, 0.018))
]

// Balls the shop typed in because the catalog doesn't have them.
const shopModels: CatalogBallDto[] = []
const models = () => [...mockCatalog, ...shopModels]
const matches = (c: CatalogBallDto, words: string[]) => words.every(w => `${c.brandName} ${c.name} ${c.color ?? ''}`.toLowerCase().includes(w))

const addShopModel = (typed: ShopBallModel): CatalogBallDto => {
    const brandName = (typed.brandId && mockCatalog.find(c => c.brandId === typed.brandId)?.brandName) || typed.brandName.trim()
    const same = shopModels.find(m => m.brandName.toLowerCase() === brandName.toLowerCase() && m.name.toLowerCase() === typed.name.trim().toLowerCase()
        && (m.color ?? '').toLowerCase() === (typed.color?.trim() ?? '').toLowerCase())
    if (same) return same
    const model: CatalogBallDto = {
        id: crypto.randomUUID(), source: 'shop', brandId: typed.brandId ?? null, brandName, name: typed.name.trim(), color: typed.color?.trim() || null,
        status: null, releaseDate: null, imageUrl: null, coverstock: typed.coverstock ? { name: typed.coverstock, material: null, type: null } : null,
        core: typed.core ? { name: typed.core, type: null } : null, finish: null, weights: [], removed: false
    }
    shopModels.push(model)
    return model
}

const balls = new Map<string, Omit<BallDetailDto, 'catalogBall' | 'history'> & { catalogBallId: string }>()
const pause = () => new Promise(resolve => setTimeout(resolve, 150))
const today = () => new Date().toISOString().slice(0, 10)
const customerName = (id: string) => {
    const c = mockCustomers.find(customer => customer.id === id)
    return c ? `${c.firstName} ${c.lastName}` : 'Customer'
}
const detail = (id: string): BallDetailDto => {
    const b = balls.get(id)
    if (!b) throw new Error('Ball not found')
    const { catalogBallId, ...rest } = b
    return { ...rest, catalogBall: models().find(c => c.id === catalogBallId)!, history: { drillCount: 0, plugCount: 0, lastWorkedMonth: null } }
}

export const mockBallsApi: BallsApi = {
    async searchCatalog(q, brandId) {
        await pause()
        const words = q.toLowerCase().split(/\s+/).filter(Boolean)
        return models().filter(c => (!brandId || c.brandId === brandId) && matches(c, words))
    },
    async brands() {
        await pause()
        const names = [...new Set(mockCatalog.map(c => c.brandName))]
        return names.map(name => ({ ...brand(name), ballCount: mockCatalog.filter(c => c.brandName === name).length }))
    },
    async catalogStatus() {
        return { ballCount: mockCatalog.length, lastRunAt: null }
    },
    async list(filter) {
        await pause()
        return [...balls.keys()].map(detail).filter(b => !filter?.customerId || b.owner?.customerId === filter.customerId)
    },
    async get(id) {
        await pause()
        return detail(id)
    },
    async lookup(brandId, serial) {
        await pause()
        const found = [...balls.values()].find(b => b.serialNumber === serial.replace(/\s+/g, '').toUpperCase() && models().find(c => c.id === b.catalogBallId)?.brandId === brandId)
        const model = found && models().find(c => c.id === found.catalogBallId)
        return found
            ? { registered: true, catalogBall: model?.source === 'catalog' ? model : null, weightLbs: found.weightLbs, history: { drillCount: 0, plugCount: 0, lastWorkedMonth: null }, companyBallId: found.id }
            : { registered: false, catalogBall: null, weightLbs: null, history: null, companyBallId: null }
    },
    async register(input) {
        await pause()
        const parsed = ballRegisterSchema.parse(input)
        const modelId = parsed.catalogBallId ?? parsed.shopModelId ?? addShopModel(parsed.newModel!).id
        const now = new Date().toISOString()
        const id = crypto.randomUUID()
        balls.set(id, {
            id, ballId: crypto.randomUUID(), catalogBallId: modelId, weightLbs: parsed.weightLbs, serialNumber: parsed.serialNumber,
            pinDistance: parsed.pinDistance, topWeight: parsed.topWeight, status: 'ACTIVE', purchaseDate: parsed.purchaseDate, notes: parsed.notes,
            owner: { customerId: parsed.customerId, name: customerName(parsed.customerId), since: today() },
            owners: [{ customerId: parsed.customerId, name: customerName(parsed.customerId), from: today(), to: null }],
            createdAt: now, updatedAt: now
        })
        return detail(id)
    },
    async update(id, input) {
        await pause()
        const parsed = ballUpdateSchema.parse(input)
        const b = balls.get(id)!
        balls.set(id, { ...b, ...Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined)), updatedAt: new Date().toISOString() })
        return detail(id)
    },
    async transfer(id, customerId) {
        await pause()
        const b = balls.get(id)!
        const owners = b.owners.map(o => (o.to === null ? { ...o, to: today() } : o))
        balls.set(id, {
            ...b, owner: { customerId, name: customerName(customerId), since: today() },
            owners: [{ customerId, name: customerName(customerId), from: today(), to: null }, ...owners]
        })
        return detail(id)
    }
}

// A ball for the first mock customer.
void mockBallsApi.register({ catalogBallId: mockCatalog[0].id, weightLbs: 15, serialNumber: 'SP1234567', customerId: '1', pinDistance: 4.5, topWeight: 2.5 })
