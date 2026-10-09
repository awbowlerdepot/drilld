import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/** A small seeded random generator, so a ball draws the same each time. */
const random = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
}

/**
 * A coverstock texture (equirectangular, wraps the sphere): the first color as
 * the base, solid when it's the only one, otherwise the others flowing through
 * it in wide, soft bands; a pearl cover gets a fine sparkle.
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
    // One color is a solid cover. More colors flow through each other in a few
    // wide, soft bands rather than many small strokes.
    const swirlColors = palette.slice(1)
    w.filter = 'blur(28px)'
    w.lineCap = 'round'
    for (let i = 0; i < (swirlColors.length ? 18 : 0); i++) {
        const x = rand() * width, y = rand() * height
        const c = [(rand() - 0.5) * 400, (rand() - 0.5) * 300, (rand() - 0.5) * 400, (rand() - 0.5) * 300, (rand() - 0.5) * 500, (rand() - 0.5) * 200]
        w.strokeStyle = swirlColors[i % swirlColors.length]
        w.globalAlpha = 0.55 + rand() * 0.3
        w.lineWidth = 60 + rand() * 90
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
