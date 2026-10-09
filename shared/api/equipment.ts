import { z } from 'zod';

/**
 * Equipment and scheduled maintenance API contract. Each location's machines,
 * their maintenance tasks (due every so many days, and every so many balls
 * once work orders are on the API), and a log of what was done and what went
 * wrong. A new drill press starts with the standard drill press tasks below,
 * scaled to how hard the shop runs it.
 */

export const EQUIPMENT_KINDS = ['DRILL_PRESS', 'BALL_SPINNER', 'RESURFACER', 'PLUG_SPINNER', 'VACUUM_PUMP', 'OTHER'] as const;
export const EQUIPMENT_STATUSES = ['IN_SERVICE', 'OUT_OF_SERVICE', 'RETIRED'] as const;
export const VOLUME_CLASSES = ['LOW', 'STANDARD', 'HIGH'] as const;
export const ISSUE_TYPES = ['JAM', 'BIT_SNAPPED', 'OTHER'] as const;

export type EquipmentKind = typeof EQUIPMENT_KINDS[number];
export type EquipmentStatus = typeof EQUIPMENT_STATUSES[number];
export type VolumeClass = typeof VOLUME_CLASSES[number];
export type IssueType = typeof ISSUE_TYPES[number];

export const EQUIPMENT_KIND_LABELS: Record<EquipmentKind, string> = {
    DRILL_PRESS: 'Drill press',
    BALL_SPINNER: 'Ball spinner',
    RESURFACER: 'Resurfacer',
    PLUG_SPINNER: 'Plug spinner',
    VACUUM_PUMP: 'Vacuum pump',
    OTHER: 'Other'
};

export const VOLUME_LABELS: Record<VolumeClass, { label: string; description: string }> = {
    LOW: { label: 'Low', description: 'Home or club shop, 1–5 balls a week' },
    STANDARD: { label: 'Standard', description: 'Independent pro shop, 10–30 balls a week' },
    HIGH: { label: 'High', description: '30+ balls a week, or league and tournament peaks' }
};

/** A drill press: column, jig, and which way its digital readout counts. */
export const drillPressDetailsSchema = z.object({
    column: z.enum(['ROUND', 'SQUARE']).nullish().transform(value => value ?? null),
    jig: z.enum(['VACUUM', 'CLAMP']).nullish().transform(value => value ?? null),
    verticalReadout: z.enum(['UP_POSITIVE', 'DOWN_POSITIVE']).nullish().transform(value => value ?? null),
    horizontalReadout: z.enum(['RIGHT_POSITIVE', 'LEFT_POSITIVE']).nullish().transform(value => value ?? null)
}).strict();

export type DrillPressDetails = z.infer<typeof drillPressDetailsSchema>;

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform(value => value || null);
const optionalDate = z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date')]).nullish().transform(value => value || null);

const equipmentFields = {
    kind: z.enum(EQUIPMENT_KINDS),
    name: z.string().trim().min(1, 'Name it').max(100),
    manufacturer: optionalText(100),
    model: optionalText(100),
    serialNumber: optionalText(100),
    purchasedOn: optionalDate,
    status: z.enum(EQUIPMENT_STATUSES),
    volume: z.enum(VOLUME_CLASSES),
    details: drillPressDetailsSchema.partial().default({}),
    notes: optionalText(2000)
};

/** Body of POST /locations/:locationId/equipment. A drill press gets the standard tasks. */
export const equipmentCreateSchema = z.object({
    ...equipmentFields,
    status: equipmentFields.status.default('IN_SERVICE'),
    volume: equipmentFields.volume.default('STANDARD')
}).strict();

/** Body of PATCH /equipment/:id. Changing the volume rescales the standard tasks' intervals. */
export const equipmentUpdateSchema = z.object(equipmentFields).omit({ kind: true }).partial().strict();

const checklistSchema = z.array(z.string().trim().min(1).max(200)).max(20);

const taskFields = {
    title: z.string().trim().min(1, 'Name the task').max(200),
    guidance: optionalText(5000),
    checklist: checklistSchema,
    videoUrl: z.string().trim().max(500).nullish().transform(value => value || null)
        .refine(value => !value || /^https?:\/\//i.test(value), 'Enter a link starting with https://'),
    intervalDays: z.number().int().min(1).max(3650).nullish().transform(value => value ?? null),
    intervalBalls: z.number().int().min(1).max(100000).nullish().transform(value => value ?? null),
    active: z.boolean()
};

const hasInterval = (task: { intervalDays?: number | null; intervalBalls?: number | null }) => !!task.intervalDays || !!task.intervalBalls;

/** Body of POST /equipment/:id/tasks: the shop's own task. */
export const maintenanceTaskCreateSchema = z.object({
    ...taskFields,
    checklist: checklistSchema.default([]),
    active: taskFields.active.default(true)
}).strict().refine(hasInterval, { message: 'Set how often it\'s due', path: ['intervalDays'] });

/** Body of PATCH /maintenance-tasks/:id. */
export const maintenanceTaskUpdateSchema = z.object({
    ...taskFields,
    /** Move the next due date (e.g. to skip a day). */
    nextDueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).partial().strict();

/** Body of POST /maintenance-tasks/:id/complete. */
export const maintenanceCompleteSchema = z.object({
    notes: optionalText(2000),
    /** The checklist items that were done. */
    checked: z.array(z.string().max(200)).max(20).default([])
}).strict();

/** Body of POST /equipment/:id/issues: something went wrong. A jam or snapped bit makes the alignment check due today. */
export const equipmentIssueSchema = z.object({
    issueType: z.enum(ISSUE_TYPES),
    notes: optionalText(2000)
}).strict();

export type EquipmentCreate = z.input<typeof equipmentCreateSchema>;
export type EquipmentUpdate = z.input<typeof equipmentUpdateSchema>;
export type MaintenanceTaskCreate = z.input<typeof maintenanceTaskCreateSchema>;
export type MaintenanceTaskUpdate = z.input<typeof maintenanceTaskUpdateSchema>;
export type MaintenanceComplete = z.input<typeof maintenanceCompleteSchema>;
export type EquipmentIssue = z.input<typeof equipmentIssueSchema>;

/** OVERDUE: past its date. DUE: today. SOON: within 3 days. OK: later. NOT_SCHEDULED: never done and no date. */
export type DueState = 'OVERDUE' | 'DUE' | 'SOON' | 'OK' | 'NOT_SCHEDULED' | 'INACTIVE';

export interface MaintenanceTaskDto {
    id: string;
    equipmentID: string;
    templateCode: string | null;
    title: string;
    guidance: string | null;
    checklist: string[];
    videoUrl: string | null;
    intervalDays: number | null;
    intervalBalls: number | null;
    active: boolean;
    lastDoneAt: string | null;
    nextDueOn: string | null;
    /** Worked out for today at the location. */
    due: DueState;
}

export interface MaintenanceLogDto {
    id: string;
    equipmentID: string;
    taskID: string | null;
    kind: 'DONE' | 'ISSUE';
    issueType: IssueType | null;
    title: string;
    notes: string | null;
    checklist: string[];
    doneByName: string | null;
    doneAt: string;
}

export interface EquipmentDto {
    id: string;
    locationID: string;
    kind: EquipmentKind;
    name: string;
    manufacturer: string | null;
    model: string | null;
    serialNumber: string | null;
    purchasedOn: string | null;
    status: EquipmentStatus;
    volume: VolumeClass;
    details: Partial<DrillPressDetails>;
    notes: string | null;
    tasks: MaintenanceTaskDto[];
    createdAt: string;
    updatedAt: string;
}

/** GET /equipment/:id: the machine, its tasks, and its log (newest first). */
export interface EquipmentDetailDto extends EquipmentDto {
    log: MaintenanceLogDto[];
}

// ==========================================
// Due dates
// ==========================================

/** YYYY-MM-DD plus some days. */
export const addDays = (date: string, days: number) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

/** Whether a task is overdue, due today, due soon or fine, on `today` (the location's date). */
export const dueState = (task: { active: boolean; nextDueOn: string | null }, today: string): DueState => {
    if (!task.active) return 'INACTIVE';
    if (!task.nextDueOn) return 'NOT_SCHEDULED';
    if (task.nextDueOn < today) return 'OVERDUE';
    if (task.nextDueOn === today) return 'DUE';
    if (task.nextDueOn <= addDays(today, 3)) return 'SOON';
    return 'OK';
};

// ==========================================
// Standard drill press tasks (issue #40)
// ==========================================

export interface MaintenanceTemplate {
    code: string;
    title: string;
    /** Days between, by volume. */
    intervalDays: Record<VolumeClass, number>;
    guidance: string;
    checklist: string[];
    /** Only for a vacuum jig. */
    vacuumOnly?: boolean;
}

/** The task a jam or snapped bit brings forward. */
export const ALIGNMENT_TASK_CODE = 'MD-06';

export const DRILL_PRESS_TEMPLATES: MaintenanceTemplate[] = [
    {
        code: 'MD-01',
        title: 'Post-drill debris clean-up',
        intervalDays: { LOW: 7, STANDARD: 1, HIGH: 1 },
        guidance: [
            'Why: resin dust packed into the jig and quill bearings causes binding and slop.',
            'Don\'t use compressed air: it drives dust into the quill bearings.',
            'Shop-vac the table, the jig and the base with a brush attachment.',
            'Wipe the ball cup so the next ball seats flat.'
        ].join('\n'),
        checklist: ['Table and base vacuumed', 'Jig and ball cup cleaned', 'No compressed air used']
    },
    {
        code: 'MD-02',
        title: 'Way & column wipe-down',
        intervalDays: { LOW: 7, STANDARD: 1, HIGH: 1 },
        guidance: [
            'Why: resin dust on the X/Y ways and column grinds them and makes the table stick, which throws off pitches.',
            'Wipe the dust off the X/Y dovetails and the column.',
            'Apply ISO 68 way oil (not WD-40) to the ways.',
            'Crank the table through its full travel to spread the oil.'
        ].join('\n'),
        checklist: ['Ways and column wiped', 'ISO 68 way oil applied', 'Table cranked through full travel']
    },
    {
        code: 'MD-03',
        title: 'Quill & column rack lube',
        intervalDays: { LOW: 30, STANDARD: 14, HIGH: 7 },
        guidance: [
            'Why: an unoiled rack slips and can ruin a layout; a dry quill sleeve wears and gets sloppy.',
            'Clean and oil the quill sleeve.',
            'Brush the dust out of the column rack teeth, then oil them lightly.'
        ].join('\n'),
        checklist: ['Quill sleeve cleaned and oiled', 'Column rack teeth cleaned and oiled']
    },
    {
        code: 'MD-04',
        title: 'Gib adjustment & backlash check',
        intervalDays: { LOW: 120, STANDARD: 90, HIGH: 60 },
        guidance: [
            'Why: loose gibs let the table wobble on dense cores, so the hole wanders.',
            'Gibs are the tapered strips in the dovetails that take up play.',
            'Snug the gib screws a little at a time until the wobble is gone but the table still cranks smoothly.',
            'Check the handwheel backlash and note it.'
        ].join('\n'),
        checklist: ['X gib adjusted', 'Y gib adjusted', 'Backlash checked and noted']
    },
    {
        code: 'MD-05',
        title: 'Spindle spline lubrication',
        intervalDays: { LOW: 365, STANDARD: 182, HIGH: 120 },
        guidance: [
            'Why: a dry spline rattles at high RPM and wears the spindle.',
            'Remove the pulley shroud and find the grease port on top of the spindle spline.',
            'Grease the spline, run the spindle briefly, and wipe off the excess.'
        ].join('\n'),
        checklist: ['Spline greased', 'Spindle run and excess wiped']
    },
    {
        code: ALIGNMENT_TASK_CODE,
        title: 'Jig tramming & squaring audit',
        intervalDays: { LOW: 365, STANDARD: 365, HIGH: 180 },
        guidance: [
            'Why: a head that has shifted (common on round columns) drills every pitch off.',
            'Put a dial indicator in the R8 taper.',
            'Sweep the ball cup to confirm zero-pitch alignment; tram the head and square the jig until it reads true.',
            'Also due right away after a jam or a snapped bit.'
        ].join('\n'),
        checklist: ['Head trammed', 'Jig squared to the spindle', 'Zero pitch confirmed with the indicator']
    },
    {
        code: 'MD-07',
        title: 'Vacuum filter & pump check',
        intervalDays: { LOW: 60, STANDARD: 30, HIGH: 14 },
        vacuumOnly: true,
        guidance: [
            'Why: a clogged filter or weak pump lets the ball move in the jig.',
            'Check the inline filter and replace it if it\'s dirty.',
            'Check the hose and fittings for leaks, and that the pump pulls full vacuum.'
        ].join('\n'),
        checklist: ['Inline filter checked or replaced', 'Hose and fittings checked', 'Pump pulls full vacuum']
    }
];

/** The standard tasks for a new drill press. */
export const templatesFor = (kind: EquipmentKind, details: Partial<DrillPressDetails>) =>
    kind === 'DRILL_PRESS' ? DRILL_PRESS_TEMPLATES.filter(t => !t.vacuumOnly || details.jig === 'VACUUM') : [];
