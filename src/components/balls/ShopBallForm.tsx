import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { shopBallModelSchema, type ShopBallModel } from '../../../shared/api/balls'
import { useCatalogBrands } from '../../hooks/useCatalogSearch'

interface ShopBallFormProps {
    onUse: (model: ShopBallModel) => void
    onCancel: () => void
}

const OTHER = 'OTHER'

/**
 * Type in a ball the BowlerIQ catalog doesn't have (older and discontinued
 * balls). It's kept in the shop's own list, so it can be picked next time.
 */
export const ShopBallForm = ({ onUse, onCancel }: ShopBallFormProps) => {
    const brands = useCatalogBrands()
    const [brandId, setBrandId] = useState<string | null>(null)
    const [otherBrand, setOtherBrand] = useState('')
    const [name, setName] = useState('')
    const [color, setColor] = useState('')
    const [coverstock, setCoverstock] = useState('')
    const [core, setCore] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const isOther = brandId === OTHER
    const clear = (field: string) => setErrors(prev => ({ ...prev, [field]: '' }))

    const use = () => {
        const model: ShopBallModel = {
            brandId: brandId && !isOther ? brandId : null,
            brandName: isOther ? otherBrand : brands.find(b => b.id === brandId)?.name ?? '',
            name, color, coverstock, core
        }
        const parsed = shopBallModelSchema.safeParse(model)
        const found: Record<string, string> = {}
        if (!parsed.success) for (const issue of parsed.error.issues) found[String(issue.path[0])] ??= issue.message
        setErrors(found)
        if (parsed.success) onUse(model)
    }

    return (
        <div className="grid gap-3 rounded-lg border border-dashed border-gray-300 p-3">
            <p className="text-sm text-gray-600">Not in the catalog? Type it in. It's kept in your shop's list for next time.</p>
            <div className="grid gap-3 sm:grid-cols-2">
                <Field data-invalid={!!errors.brandName}>
                    <FieldLabel>Brand</FieldLabel>
                    <Select value={brandId ?? ''} onValueChange={v => { setBrandId(v); clear('brandName') }}>
                        <SelectTrigger aria-label="Brand"><SelectValue placeholder="Pick the brand" /></SelectTrigger>
                        <SelectContent>
                            {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            <SelectItem value={OTHER}>Another brand…</SelectItem>
                        </SelectContent>
                    </Select>
                    {isOther && <Input aria-label="Brand name" placeholder="Brand" value={otherBrand} onChange={event => { setOtherBrand(event.target.value); clear('brandName') }} />}
                    {isOther && <FieldDescription>Serial numbers of other brands can't be matched at other shops.</FieldDescription>}
                    {errors.brandName && <FieldError>{errors.brandName}</FieldError>}
                </Field>
                <Field data-invalid={!!errors.name}>
                    <FieldLabel htmlFor="shop-ball-name">Ball</FieldLabel>
                    <Input id="shop-ball-name" placeholder="Hy-Road" value={name} onChange={event => { setName(event.target.value); clear('name') }} />
                    {errors.name && <FieldError>{errors.name}</FieldError>}
                </Field>
                <Field>
                    <FieldLabel htmlFor="shop-ball-color">Color (optional)</FieldLabel>
                    <Input id="shop-ball-color" value={color} onChange={event => setColor(event.target.value)} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="shop-ball-cover">Cover (optional)</FieldLabel>
                    <Input id="shop-ball-cover" value={coverstock} onChange={event => setCoverstock(event.target.value)} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="shop-ball-core">Core (optional)</FieldLabel>
                    <Input id="shop-ball-core" value={core} onChange={event => setCore(event.target.value)} />
                </Field>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Back to the catalog</Button>
                <Button type="button" size="sm" onClick={use}>Use this ball</Button>
            </div>
        </div>
    )
}
