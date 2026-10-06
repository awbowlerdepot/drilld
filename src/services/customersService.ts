import type { CustomerCreate, CustomerDto, CustomerUpdate } from '../../shared/api/customers'
import type { Customer } from '../types'
import { apiRequest } from './apiClient'

/** API customer → the frontend's Customer (nulls become absent fields). */
const toCustomer = (dto: CustomerDto): Customer => ({
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email ?? undefined,
    phone: dto.phone ?? undefined,
    dominantHand: dto.dominantHand,
    preferredGripStyle: dto.preferredGripStyle,
    usesThumb: dto.usesThumb,
    notes: dto.notes ?? undefined,
    homeLocationID: dto.homeLocationID ?? undefined,
    createdAt: dto.createdAt
})

type CustomerFields = Omit<Customer, 'id' | 'createdAt'>

/** Only the fields present in the input are sent, so a partial update never clears other fields. */
const toRequest = (customer: Partial<CustomerFields>): CustomerUpdate => {
    const request: CustomerUpdate = {}
    if ('firstName' in customer) request.firstName = customer.firstName
    if ('lastName' in customer) request.lastName = customer.lastName
    if ('email' in customer) request.email = customer.email || null
    if ('phone' in customer) request.phone = customer.phone || null
    if ('dominantHand' in customer) request.dominantHand = customer.dominantHand
    if ('preferredGripStyle' in customer) request.preferredGripStyle = customer.preferredGripStyle
    if ('usesThumb' in customer) request.usesThumb = customer.usesThumb
    if ('notes' in customer) request.notes = customer.notes || null
    if ('homeLocationID' in customer) request.homeLocationID = customer.homeLocationID || null
    return request
}

export const customersService = {
    list: async () => (await apiRequest<CustomerDto[]>('GET', '/customers')).map(toCustomer),
    create: async (customer: CustomerFields) =>
        toCustomer(await apiRequest<CustomerDto>('POST', '/customers', toRequest(customer) as CustomerCreate)),
    update: async (id: string, changes: Partial<CustomerFields>) =>
        toCustomer(await apiRequest<CustomerDto>('PATCH', `/customers/${id}`, toRequest(changes))),
    remove: (id: string) => apiRequest<void>('DELETE', `/customers/${id}`)
}
