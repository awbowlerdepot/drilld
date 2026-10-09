import { useEffect, useState } from 'react'
import type { CatalogBallDto, CatalogBrandDto } from '../../shared/api/balls'
import { ballsApi } from './useCompanyBalls'

let brandsCache: Promise<CatalogBrandDto[]> | null = null

/** The catalog's brands (fetched once). */
export const useCatalogBrands = () => {
    const [brands, setBrands] = useState<CatalogBrandDto[]>([])
    useEffect(() => {
        brandsCache ??= ballsApi.brands()
        brandsCache.then(setBrands).catch(() => { brandsCache = null })
    }, [])
    return brands
}

/** Searches the ball catalog as the person types (after a short pause), optionally within one brand. */
export const useCatalogSearch = (query: string, brandId: string | null) => {
    const [results, setResults] = useState<CatalogBallDto[]>([])
    const brands = useCatalogBrands()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        if (!query.trim() && !brandId) {
            setResults([])
            return
        }
        setLoading(true)
        const timer = setTimeout(() => {
            ballsApi.searchCatalog(query.trim(), brandId ?? undefined)
                .then(list => { if (!cancelled) { setResults(list); setError(null) } })
                .catch((err: Error) => { if (!cancelled) setError(err.message) })
                .finally(() => { if (!cancelled) setLoading(false) })
        }, 250)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [query, brandId])

    return { results, brands, loading, error }
}
