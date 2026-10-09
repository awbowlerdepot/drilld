import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/** A hex color lighter (factor > 1) or darker. */
const shade = (hex: string, factor: number) => {
    const n = parseInt(hex.slice(1), 16)
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * factor))))
    return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`
}

/** A small seeded random generator, so a ball draws the same each time. */
const random = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
}

/**
 * A coverstock texture (equirectangular, wraps the sphere): the first color as
 * the base, swirls of the others over it, blurred like a reactive cover; a
 * pearl cover gets a fine sparkle.
 */
export const coverstockTexture = (palette: string[], pearl: boolean, seed = 7) => {
    const width = 1024, height = 512
    // Drawn three times as wide, the same swirls repeated a width apart, and the
    // middle kept: its two edges then match where the cover wraps around.
    const wide = document.createElement('canvas')
    wide.width = width * 3
    wide.height = height
    const w = wide.getContext('2d')!
    const rand = random(seed)
    w.fillStyle = palette[0]
    w.fillRect(0, 0, width * 3, height)
    // One color: swirl lighter and darker shades of it.
    const swirlColors = palette.length > 1 ? palette.slice(1) : [shade(palette[0], 1.45), shade(palette[0], 0.6)]
    w.filter = 'blur(10px)'
    w.lineCap = 'round'
    for (let i = 0; i < 70; i++) {
        const x = rand() * width, y = rand() * height
        const c = [(rand() - 0.5) * 400, (rand() - 0.5) * 300, (rand() - 0.5) * 400, (rand() - 0.5) * 300, (rand() - 0.5) * 500, (rand() - 0.5) * 200]
        w.strokeStyle = swirlColors[i % swirlColors.length]
        w.globalAlpha = 0.35 + rand() * 0.45
        w.lineWidth = 8 + rand() * 40
        for (const copy of [0, 1, 2]) {
            const ox = x + copy * width
            w.beginPath()
            w.moveTo(ox, y)
            w.bezierCurveTo(ox + c[0], y + c[1], ox + c[2], y + c[3], ox + c[4], y + c[5])
            w.stroke()
        }
    }
    w.filter = 'none'
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(wide, width, 0, width, height, 0, 0, width, height)
    if (pearl) {
        for (let i = 0; i < 9000; i++) {
            ctx.globalAlpha = rand() * 0.35
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(rand() * width, rand() * height, 1.2, 1.2)
        }
    }
    ctx.globalAlpha = 1
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.wrapS = RepeatWrapping
    texture.anisotropy = 8
    return texture
}
