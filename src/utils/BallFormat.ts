import type { CatalogBallDto } from '../../shared/api/balls'
import { format32 } from './Fractions'

/** "Storm Phaze II". */
export const ballName = (ball: Pick<CatalogBallDto, 'brandName' | 'name'>) => `${ball.brandName} ${ball.name}`

/** Pin distance as shops write it: 4-1/2″ when it's a whole 32nd, otherwise 4.375″. */
export const formatInches = (inches: number | null) => {
    if (inches == null) return '—'
    const n32 = inches * 32
    return Math.abs(n32 - Math.round(n32)) < 1e-6 ? `${format32(Math.round(n32))}″` : `${inches.toFixed(3).replace(/0+$/, '')}″`
}

/** "2.48 RG · .051 diff · .019 MB" for one weight. */
export const describeWeightSpecs = (ball: CatalogBallDto, weightLbs: number) => {
    const w = ball.weights.find(x => x.weightLbs === weightLbs)
    if (!w) return null
    const dec = (v: number) => v.toFixed(3).replace(/^0/, '')
    return [w.rg != null && `${w.rg.toFixed(2)} RG`, w.differential != null && `${dec(w.differential)} diff`, w.massBias != null && `${dec(w.massBias)} MB`]
        .filter(Boolean).join(' · ') || null
}

/** "TX-16 Solid · Velocity (symmetric)". */
export const describeConstruction = (ball: CatalogBallDto) =>
    [ball.coverstock?.name, ball.core?.name && `${ball.core.name}${ball.core.type ? ` (${ball.core.type})` : ''}`].filter(Boolean).join(' · ')
