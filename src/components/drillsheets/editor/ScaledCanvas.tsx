import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

interface ScaledCanvasProps {
    width: number
    height: number
    children: ReactNode
}

/**
 * Lays children out on a fixed width × height canvas (absolute positions) and
 * scales it down to fit narrower containers, such as a phone.
 */
export const ScaledCanvas = ({ width, height, children }: ScaledCanvasProps) => {
    const outer = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useLayoutEffect(() => {
        const element = outer.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / width)))
        observer.observe(element)
        return () => observer.disconnect()
    }, [width])

    return (
        <div ref={outer} className="w-full" style={{ height: height * scale }}>
            <div className="relative mx-auto origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
                {children}
            </div>
        </div>
    )
}
