import { Suspense, lazy } from 'react'
import { cn } from '@/lib/utils'
import type { BallSceneProps } from './BallScene'

// Three.js loads only when a 3D ball is first shown.
const BallScene = lazy(() => import('./BallScene'))

interface BallView3DProps extends BallSceneProps {
    className?: string
}

/** The 3D ball in a box, loading the 3D code on first use. */
export const BallView3D = ({ className, ...scene }: BallView3DProps) => (
    <div className={cn('relative overflow-hidden rounded-xl bg-gradient-to-b from-gray-100 to-gray-300', className)}>
        <Suspense fallback={<p className="flex size-full items-center justify-center text-sm text-gray-500">Loading the 3D view…</p>}>
            <BallScene {...scene} />
        </Suspense>
    </div>
)
