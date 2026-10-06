import React, { useState } from 'react';
import { customerCreateSchema } from '../../../shared/api/customers';
import { Customer } from '../../types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type CustomerFields = Omit<Customer, 'id' | 'createdAt'>;

interface CustomerFormProps {
    customer?: Customer;
    onSave: (customer: CustomerFields) => void | Promise<void>;
    onCancel: () => void;
}

const GRIP_STYLES: { value: Customer['preferredGripStyle']; label: string }[] = [
    { value: 'FINGERTIP', label: 'Fingertip' },
    { value: 'CONVENTIONAL', label: 'Conventional' },
    { value: 'TWO_HANDED_NO_THUMB', label: 'Two-handed (no thumb)' }
];

/** Add or edit a customer, in a dialog. Validates with the same schema as the API. */
export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSave, onCancel }) => {
    const [form, setForm] = useState({
        firstName: customer?.firstName ?? '',
        lastName: customer?.lastName ?? '',
        email: customer?.email ?? '',
        phone: customer?.phone ?? '',
        dominantHand: customer?.dominantHand ?? 'RIGHT',
        preferredGripStyle: customer?.preferredGripStyle ?? 'FINGERTIP',
        usesThumb: customer?.usesThumb ?? true,
        notes: customer?.notes ?? ''
    });
    const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
    const [saving, setSaving] = useState(false);

    const update = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) => {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = customerCreateSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: Partial<Record<keyof typeof form, string>> = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0] as keyof typeof form;
                fieldErrors[field] ??= issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        setSaving(true);
        try {
            await onSave({
                ...form,
                email: form.email.trim() || undefined,
                phone: form.phone.trim() || undefined,
                notes: form.notes.trim() || undefined
            });
        } finally {
            setSaving(false);
        }
    };

    const isEditing = Boolean(customer);

    return (
        <Dialog open onOpenChange={open => { if (!open) onCancel(); }}>
            <DialogContent className="sm:max-w-xl">
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit customer' : 'Add customer'}</DialogTitle>
                        <DialogDescription>
                            Contact details and how they bowl. Drill sheets are added from the customer's profile.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.firstName)}>
                                <FieldLabel htmlFor="customer-first-name">First name</FieldLabel>
                                <Input
                                    id="customer-first-name"
                                    value={form.firstName}
                                    onChange={e => update('firstName', e.target.value)}
                                    aria-invalid={Boolean(errors.firstName)}
                                    autoComplete="off"
                                    autoFocus
                                />
                                {errors.firstName && <FieldError>{errors.firstName}</FieldError>}
                            </Field>
                            <Field data-invalid={Boolean(errors.lastName)}>
                                <FieldLabel htmlFor="customer-last-name">Last name</FieldLabel>
                                <Input
                                    id="customer-last-name"
                                    value={form.lastName}
                                    onChange={e => update('lastName', e.target.value)}
                                    aria-invalid={Boolean(errors.lastName)}
                                    autoComplete="off"
                                />
                                {errors.lastName && <FieldError>{errors.lastName}</FieldError>}
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field data-invalid={Boolean(errors.email)}>
                                <FieldLabel htmlFor="customer-email">Email</FieldLabel>
                                <Input
                                    id="customer-email"
                                    type="email"
                                    value={form.email}
                                    onChange={e => update('email', e.target.value)}
                                    aria-invalid={Boolean(errors.email)}
                                    placeholder="Optional"
                                />
                                {errors.email && <FieldError>{errors.email}</FieldError>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
                                <Input
                                    id="customer-phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => update('phone', e.target.value)}
                                    placeholder="Optional"
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="customer-hand">Dominant hand</FieldLabel>
                                <Select
                                    value={form.dominantHand}
                                    onValueChange={value => update('dominantHand', value as Customer['dominantHand'])}
                                >
                                    <SelectTrigger id="customer-hand" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RIGHT">Right</SelectItem>
                                        <SelectItem value="LEFT">Left</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="customer-grip">Preferred grip</FieldLabel>
                                <Select
                                    value={form.preferredGripStyle}
                                    onValueChange={value => update('preferredGripStyle', value as Customer['preferredGripStyle'])}
                                >
                                    <SelectTrigger id="customer-grip" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {GRIP_STYLES.map(grip => (
                                            <SelectItem key={grip.value} value={grip.value}>{grip.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        </div>

                        <Field orientation="horizontal">
                            <Switch
                                id="customer-uses-thumb"
                                checked={form.usesThumb}
                                onCheckedChange={checked => update('usesThumb', checked)}
                            />
                            <FieldLabel htmlFor="customer-uses-thumb">Uses thumb</FieldLabel>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="customer-notes">Notes</FieldLabel>
                            <Textarea
                                id="customer-notes"
                                rows={3}
                                value={form.notes}
                                onChange={e => update('notes', e.target.value)}
                                placeholder="Preferences, history, anything the next tech should know"
                            />
                        </Field>
                    </FieldGroup>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add customer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
