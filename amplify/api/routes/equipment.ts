import { Hono } from 'hono';
import { sql, type Selectable } from 'kysely';
import {
    ALIGNMENT_TASK_CODE,
    DRILL_PRESS_TEMPLATES,
    addDays,
    dueState,
    equipmentCreateSchema,
    equipmentIssueSchema,
    equipmentUpdateSchema,
    maintenanceCompleteSchema,
    maintenanceTaskCreateSchema,
    maintenanceTaskUpdateSchema,
    templatesFor,
    type DrillPressDetails,
    type EquipmentDetailDto,
    type EquipmentDto,
    type EquipmentKind,
    type MaintenanceLogDto,
    type MaintenanceTaskDto,
    type VolumeClass
} from '../../../shared/api/equipment';
import { json, uuid, withCompany, type Tx } from '../db/client';
import type { Equipment, MaintenanceLog, MaintenanceTask } from '../db/schema';
import { HttpError } from '../errors';
import { loadAccess, requirePermission } from '../permissions';
import type { ApiEnv } from '../app';

// Equipment and its scheduled maintenance, per location. Setting up machines
// and tasks needs manage:settings at the location (managers, owners, admins);
// doing maintenance and reporting problems needs write:workorders there
// (anyone who drills); seeing it needs read:workorders.

const idParam = (value: string | undefined, what: string) => {
    if (!value || !/^[0-9a-f-]{36}$/i.test(value)) throw new HttpError(404, `${what} not found`);
    return value;
};

/** Today's date at the location (its time zone). */
const todayIn = (timeZone: string) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(new Date()).map(p => [p.type, p.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
};

const dateOnly = (value: unknown): string | null =>
    value == null ? null : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

const taskDto = (row: Selectable<MaintenanceTask>, today: string): MaintenanceTaskDto => {
    const nextDueOn = dateOnly(row.next_due_on);
    return {
        id: row.id,
        equipmentID: row.equipment_id,
        templateCode: row.template_code,
        title: row.title,
        guidance: row.guidance,
        checklist: (row.checklist as string[]) ?? [],
        videoUrl: row.video_url,
        intervalDays: row.interval_days,
        intervalBalls: row.interval_balls,
        active: row.active,
        lastDoneAt: row.last_done_at ? new Date(row.last_done_at).toISOString() : null,
        nextDueOn,
        due: dueState({ active: row.active, nextDueOn }, today)
    };
};

const equipmentDto = (row: Selectable<Equipment>, tasks: Selectable<MaintenanceTask>[], today: string): EquipmentDto => ({
    id: row.id,
    locationID: row.location_id,
    kind: row.kind as EquipmentKind,
    name: row.name,
    manufacturer: row.manufacturer,
    model: row.model,
    serialNumber: row.serial_number,
    purchasedOn: dateOnly(row.purchased_on),
    status: row.status as EquipmentDto['status'],
    volume: row.volume as VolumeClass,
    details: (row.details as Partial<DrillPressDetails>) ?? {},
    notes: row.notes,
    tasks: tasks.filter(t => t.equipment_id === row.id)
        .map(t => taskDto(t, today))
        .sort((a, b) => (a.templateCode ?? 'ZZ').localeCompare(b.templateCode ?? 'ZZ') || a.title.localeCompare(b.title)),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
});

const locationOf = async (tx: Tx, locationId: string) => {
    const row = await tx.selectFrom('location').select(['id', 'timezone']).where('id', '=', uuid(locationId)).executeTakeFirst();
    if (!row) throw new HttpError(404, 'Location not found');
    return row;
};

const loadEquipment = async (tx: Tx, id: string) => {
    const row = await tx.selectFrom('equipment').selectAll().where('id', '=', uuid(id)).executeTakeFirst();
    if (!row) throw new HttpError(404, 'Equipment not found');
    const location = await locationOf(tx, row.location_id);
    return { row, today: todayIn(location.timezone) };
};

const tasksOf = (tx: Tx, equipmentIds: string[]) => equipmentIds.length === 0
    ? Promise.resolve([] as Selectable<MaintenanceTask>[])
    : tx.selectFrom('maintenance_task').selectAll().where('equipment_id', 'in', equipmentIds.map(uuid)).execute();

const checklistParam = (items: string[]) => json(items);
const dateParam = (value: string | null) => (value === null ? null : sql<string>`cast(${value} as date)`);

/**
 * Adds the standard tasks a machine should have and doesn't yet (a new drill
 * press; a jig changed to vacuum), first due one interval from today.
 */
const addStandardTasks = async (tx: Tx, companyId: string, equipment: Selectable<Equipment>, today: string) => {
    const existing = new Set((await tasksOf(tx, [equipment.id])).map(t => t.template_code));
    const volume = equipment.volume as VolumeClass;
    const missing = templatesFor(equipment.kind as EquipmentKind, (equipment.details as Partial<DrillPressDetails>) ?? {})
        .filter(t => !existing.has(t.code));
    if (missing.length === 0) return;
    await tx.insertInto('maintenance_task').values(missing.map(t => ({
        company_id: uuid(companyId),
        equipment_id: uuid(equipment.id),
        template_code: t.code,
        title: t.title,
        guidance: t.guidance,
        checklist: checklistParam(t.checklist),
        interval_days: t.intervalDays[volume],
        next_due_on: dateParam(addDays(today, t.intervalDays[volume]))
    }))).execute();
};

const logDto = (row: Selectable<MaintenanceLog> & { done_by_name: string | null }): MaintenanceLogDto => ({
    id: row.id,
    equipmentID: row.equipment_id,
    taskID: row.task_id,
    kind: row.kind as MaintenanceLogDto['kind'],
    issueType: row.issue_type as MaintenanceLogDto['issueType'],
    title: row.title,
    notes: row.notes,
    checklist: (row.checklist as string[]) ?? [],
    doneByName: row.done_by_name,
    doneAt: new Date(row.done_at).toISOString()
});

const detailDto = async (tx: Tx, id: string): Promise<EquipmentDetailDto> => {
    const { row, today } = await loadEquipment(tx, id);
    const tasks = await tasksOf(tx, [id]);
    const log = await tx.selectFrom('maintenance_log as l')
        .leftJoin('app_user as u', 'u.id', 'l.done_by_user_id')
        .selectAll('l')
        .select(sql<string | null>`u.first_name || ' ' || u.last_name`.as('done_by_name'))
        .where('l.equipment_id', '=', uuid(id))
        .orderBy('l.done_at', 'desc')
        .limit(100)
        .execute();
    return { ...equipmentDto(row, tasks, today), log: log.map(logDto) };
};

/** GET and POST /locations/:locationId/equipment. */
export const locationEquipment = new Hono<ApiEnv>()
    .get('/', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const locationId = idParam(c.req.param('locationId'), 'Location');
        requirePermission(await loadAccess(tx, c.var.user), 'read:workorders', locationId);
        const location = await locationOf(tx, locationId);
        const rows = await tx.selectFrom('equipment').selectAll()
            .where('location_id', '=', uuid(locationId))
            .orderBy('status').orderBy('name')
            .execute();
        const tasks = await tasksOf(tx, rows.map(r => r.id));
        const today = todayIn(location.timezone);
        return c.json(rows.map(row => equipmentDto(row, tasks, today)));
    }))

    .post('/', async c => {
        const locationId = idParam(c.req.param('locationId'), 'Location');
        const input = equipmentCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            requirePermission(await loadAccess(tx, c.var.user), 'manage:settings', locationId);
            const location = await locationOf(tx, locationId);
            const row = await tx.insertInto('equipment').values({
                company_id: uuid(c.var.user.companyId),
                location_id: uuid(locationId),
                kind: input.kind,
                name: input.name,
                manufacturer: input.manufacturer,
                model: input.model,
                serial_number: input.serialNumber,
                purchased_on: dateParam(input.purchasedOn),
                status: input.status,
                volume: input.volume,
                details: json(input.details),
                notes: input.notes,
                created_by_user_id: uuid(c.var.user.userId)
            }).returningAll().executeTakeFirstOrThrow();
            await addStandardTasks(tx, c.var.user.companyId, row, todayIn(location.timezone));
            return c.json(await detailDto(tx, row.id), 201);
        });
    });

/** /equipment/:id: one machine, its tasks and its log. */
export const equipment = new Hono<ApiEnv>()
    .get('/:id', c => withCompany(c.var.db, c.var.user.companyId, async tx => {
        const id = idParam(c.req.param('id'), 'Equipment');
        const { row } = await loadEquipment(tx, id);
        requirePermission(await loadAccess(tx, c.var.user), 'read:workorders', row.location_id);
        return c.json(await detailDto(tx, id));
    }))

    /** Edits the machine. A new volume rescales the standard tasks; a vacuum jig adds its task. */
    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'), 'Equipment');
        const input = equipmentUpdateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const { row: before, today } = await loadEquipment(tx, id);
            requirePermission(await loadAccess(tx, c.var.user), 'manage:settings', before.location_id);
            const changes = {
                ...(input.name !== undefined && { name: input.name }),
                ...(input.manufacturer !== undefined && { manufacturer: input.manufacturer }),
                ...(input.model !== undefined && { model: input.model }),
                ...(input.serialNumber !== undefined && { serial_number: input.serialNumber }),
                ...(input.purchasedOn !== undefined && { purchased_on: dateParam(input.purchasedOn) }),
                ...(input.status !== undefined && { status: input.status }),
                ...(input.volume !== undefined && { volume: input.volume }),
                ...(input.details !== undefined && { details: json({ ...(before.details as object), ...input.details }) }),
                ...(input.notes !== undefined && { notes: input.notes })
            };
            if (Object.keys(changes).length === 0) throw new HttpError(400, 'Nothing to update');
            const row = await tx.updateTable('equipment').set(changes).where('id', '=', uuid(id)).returningAll().executeTakeFirstOrThrow();

            if (input.volume && input.volume !== before.volume) {
                // Standard tasks take the new volume's interval, counted from when they were last done.
                for (const task of await tasksOf(tx, [id])) {
                    const template = DRILL_PRESS_TEMPLATES.find(t => t.code === task.template_code);
                    if (!template) continue;
                    const days = template.intervalDays[input.volume];
                    const from = task.last_done_at ? new Date(task.last_done_at).toISOString().slice(0, 10) : today;
                    await tx.updateTable('maintenance_task')
                        .set({ interval_days: days, next_due_on: dateParam(addDays(from, days)) })
                        .where('id', '=', uuid(task.id)).execute();
                }
            }
            await addStandardTasks(tx, c.var.user.companyId, row, today);
            return c.json(await detailDto(tx, id));
        });
    })

    /** Adds the shop's own task, first due one interval from today. */
    .post('/:id/tasks', async c => {
        const id = idParam(c.req.param('id'), 'Equipment');
        const input = maintenanceTaskCreateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const { row, today } = await loadEquipment(tx, id);
            requirePermission(await loadAccess(tx, c.var.user), 'manage:settings', row.location_id);
            await tx.insertInto('maintenance_task').values({
                company_id: uuid(c.var.user.companyId),
                equipment_id: uuid(id),
                title: input.title,
                guidance: input.guidance,
                checklist: checklistParam(input.checklist),
                video_url: input.videoUrl,
                interval_days: input.intervalDays,
                interval_balls: input.intervalBalls,
                active: input.active,
                next_due_on: input.intervalDays ? dateParam(addDays(today, input.intervalDays)) : null
            }).execute();
            return c.json(await detailDto(tx, id), 201);
        });
    })

    /**
     * Something went wrong (a jam, a snapped bit): logged on the machine, and the
     * alignment check is due today.
     */
    .post('/:id/issues', async c => {
        const id = idParam(c.req.param('id'), 'Equipment');
        const input = equipmentIssueSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const { row, today } = await loadEquipment(tx, id);
            requirePermission(await loadAccess(tx, c.var.user), 'write:workorders', row.location_id);
            const title = { JAM: 'Machine jammed', BIT_SNAPPED: 'Bit snapped', OTHER: 'Problem reported' }[input.issueType];
            await tx.insertInto('maintenance_log').values({
                company_id: uuid(c.var.user.companyId),
                equipment_id: uuid(id),
                kind: 'ISSUE',
                issue_type: input.issueType,
                title,
                notes: input.notes,
                done_by_user_id: uuid(c.var.user.userId)
            }).execute();
            if (input.issueType !== 'OTHER') {
                await tx.updateTable('maintenance_task').set({ next_due_on: dateParam(today) })
                    .where('equipment_id', '=', uuid(id))
                    .where('template_code', '=', ALIGNMENT_TASK_CODE)
                    .where('active', '=', true)
                    .execute();
            }
            return c.json(await detailDto(tx, id), 201);
        });
    });

const loadTask = async (tx: Tx, id: string) => {
    const task = await tx.selectFrom('maintenance_task').selectAll().where('id', '=', uuid(id)).executeTakeFirst();
    if (!task) throw new HttpError(404, 'Task not found');
    const { row, today } = await loadEquipment(tx, task.equipment_id);
    return { task, equipment: row, today };
};

/** /maintenance-tasks/:id: change a task, mark it done, remove the shop's own. */
export const maintenanceTasks = new Hono<ApiEnv>()
    .patch('/:id', async c => {
        const id = idParam(c.req.param('id'), 'Task');
        const input = maintenanceTaskUpdateSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const { task, equipment: machine, today } = await loadTask(tx, id);
            requirePermission(await loadAccess(tx, c.var.user), 'manage:settings', machine.location_id);
            const intervalDays = input.intervalDays !== undefined ? input.intervalDays : task.interval_days;
            const intervalBalls = input.intervalBalls !== undefined ? input.intervalBalls : task.interval_balls;
            if (!intervalDays && !intervalBalls) throw new HttpError(400, 'Set how often it\'s due');
            // A new interval re-counts from when it was last done (or today), unless a date is given.
            const from = task.last_done_at ? new Date(task.last_done_at).toISOString().slice(0, 10) : today;
            const nextDue = input.nextDueOn !== undefined ? input.nextDueOn
                : input.intervalDays !== undefined && intervalDays ? addDays(from, intervalDays) : undefined;
            await tx.updateTable('maintenance_task').set({
                ...(input.title !== undefined && { title: input.title }),
                ...(input.guidance !== undefined && { guidance: input.guidance }),
                ...(input.checklist !== undefined && { checklist: checklistParam(input.checklist) }),
                ...(input.videoUrl !== undefined && { video_url: input.videoUrl }),
                ...(input.intervalDays !== undefined && { interval_days: input.intervalDays }),
                ...(input.intervalBalls !== undefined && { interval_balls: input.intervalBalls }),
                ...(input.active !== undefined && { active: input.active }),
                ...(nextDue !== undefined && { next_due_on: dateParam(nextDue) })
            }).where('id', '=', uuid(id)).execute();
            return c.json(await detailDto(tx, machine.id));
        });
    })

    /** Marks it done: logged with the checklist, and next due one interval from today. */
    .post('/:id/complete', async c => {
        const id = idParam(c.req.param('id'), 'Task');
        const input = maintenanceCompleteSchema.parse(await c.req.json());
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const { task, equipment: machine, today } = await loadTask(tx, id);
            requirePermission(await loadAccess(tx, c.var.user), 'write:workorders', machine.location_id);
            await tx.insertInto('maintenance_log').values({
                company_id: uuid(c.var.user.companyId),
                equipment_id: uuid(machine.id),
                task_id: uuid(id),
                kind: 'DONE',
                title: task.title,
                notes: input.notes,
                checklist: checklistParam(input.checked),
                done_by_user_id: uuid(c.var.user.userId)
            }).execute();
            await tx.updateTable('maintenance_task').set({
                last_done_at: sql`now()`,
                next_due_on: task.interval_days ? dateParam(addDays(today, task.interval_days)) : null
            }).where('id', '=', uuid(id)).execute();
            return c.json(await detailDto(tx, machine.id));
        });
    })

    /** Removes one of the shop's own tasks (standard tasks are turned off instead). Its log stays. */
    .delete('/:id', c => {
        const id = idParam(c.req.param('id'), 'Task');
        return withCompany(c.var.db, c.var.user.companyId, async tx => {
            const { task, equipment: machine } = await loadTask(tx, id);
            requirePermission(await loadAccess(tx, c.var.user), 'manage:settings', machine.location_id);
            if (task.template_code) throw new HttpError(409, 'Standard tasks can be turned off, not removed');
            await tx.deleteFrom('maintenance_task').where('id', '=', uuid(id)).execute();
            return c.json(await detailDto(tx, machine.id));
        });
    });
