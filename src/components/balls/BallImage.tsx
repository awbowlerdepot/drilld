import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { CatalogBallDto } from '../../../shared/api/balls'

interface BallImageProps {
    ball: Pick<CatalogBallDto, 'brandName' | 'name' | 'imageUrl'>
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const SIZES = { sm: 'size-9 text-[10px]', md: 'size-12 text-xs', lg: 'size-32 text-base' }

/** The ball's catalog image, round; the brand's initials when there's none (or it fails to load). */
export const BallImage = ({ ball, size = 'md', className }: BallImageProps) => {
    const [failed, setFailed] = useState(false)
    const src = !failed ? ball.imageUrl : null
    return (
        <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-400', SIZES[size], className)}>
            {src
                ? <img src={src} alt={size === 'lg' ? `${ball.brandName} ${ball.name}` : ''} className="size-full object-contain" loading="lazy" onError={() => setFailed(true)} />
                : <span aria-hidden="true">{ball.brandName.slice(0, 2)}</span>}
        </span>
    )
}
