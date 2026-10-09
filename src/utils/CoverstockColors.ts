/**
 * The colors of a ball, for drawing its coverstock: picked from the catalog
 * photo when the browser may read it, otherwise from the color's name
 * ("Pitch Purple", "Black / Teal").
 */

const NAMED: Record<string, string> = {
    black: '#16161d', white: '#e8e8ec', silver: '#a9adb6', gray: '#6b7280', grey: '#6b7280', smoke: '#4b5058', charcoal: '#2e3138',
    red: '#b3141f', crimson: '#9e1328', burgundy: '#5c1424', maroon: '#5a1420', pink: '#e0569a', rose: '#c8467a', magenta: '#b0207a',
    orange: '#e8661a', yellow: '#efc61a', gold: '#c99a2e', bronze: '#8c5a2b', copper: '#a5552a', brown: '#5b3a24',
    green: '#1f8a4c', lime: '#7cc22b', teal: '#128a8a', aqua: '#2cb9c4', turquoise: '#21a3a8', cyan: '#2cb9c4',
    blue: '#1d4ed8', royal: '#2242b8', navy: '#1b2a5c', sky: '#4aa3e0', purple: '#5b2a8c', violet: '#6d38b0', plum: '#5c2a5c', lavender: '#9b86d6'
}

const DEFAULT_PALETTE = ['#1d3c8f', '#5b2a8c', '#16161d']

/** Colors from the color's name; a deep blue/purple when none match. */
export const paletteFromName = (color: string | null): string[] => {
    const found = (color ?? '').toLowerCase().split(/[^a-z]+/).map(word => NAMED[word]).filter(Boolean)
    return found.length ? [...new Set(found)] : DEFAULT_PALETTE
}

const hex = (r: number, g: number, b: number) => `#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`

/**
 * The main colors in a product photo (a ball on a white background): pixels
 * near white or transparent are skipped, the rest grouped coarsely, and the
 * biggest groups returned. Null if the photo can't be read (cross-origin).
 */
export const paletteFromImage = (url: string): Promise<string[] | null> => new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
        try {
            const size = 48
            const canvas = document.createElement('canvas')
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(img, 0, 0, size, size)
            const data = ctx.getImageData(0, 0, size, size).data
            const groups = new Map<string, { n: number; r: number; g: number; b: number }>()
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
                if (a < 200 || (r > 225 && g > 225 && b > 225)) continue
                const key = `${r >> 5}-${g >> 5}-${b >> 5}`
                const group = groups.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
                group.n++; group.r += r; group.g += g; group.b += b
                groups.set(key, group)
            }
            const top = [...groups.values()].sort((x, y) => y.n - x.n).slice(0, 4).filter(g => g.n > 12)
            resolve(top.length ? top.map(g => hex(g.r / g.n, g.g / g.n, g.b / g.n)) : null)
        } catch {
            resolve(null)
        }
    }
    img.onerror = () => resolve(null)
    img.src = url
})
