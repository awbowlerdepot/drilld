import { cn } from '@/lib/utils'
import { SPECIALTY_CATEGORIES } from '../../types'

interface EmployeeSpecialtiesInputProps {
    value: string[]
    onChange: (specialties: string[]) => void
}

const ALL = Object.values(SPECIALTY_CATEGORIES).flat() as string[]

/** Toggle chips for what the employee is good at. */
export const EmployeeSpecialtiesInput = ({ value, onChange }: EmployeeSpecialtiesInputProps) => (
    <div role="group" aria-label="Specialties" className="flex flex-wrap gap-1.5">
        {[...ALL, ...value.filter(s => !ALL.includes(s))].map(specialty => {
            const on = value.includes(specialty)
            return (
                <button key={specialty} type="button" aria-pressed={on}
                    onClick={() => onChange(on ? value.filter(s => s !== specialty) : [...value, specialty])}
                    className={cn('min-h-8 rounded-full border px-3 text-sm transition-colors',
                        on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white text-gray-700 hover:bg-muted')}>
                    {specialty}
                </button>
            )
        })}
    </div>
)
