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
    type EquipmentDetailDto,
    type MaintenanceLogDto,
    type MaintenanceTaskDto
} from '../../shared/api/equipment'
import type { EquipmentApi } from '../services/equipmentService'

// Equipment and maintenance without sign-in: kept in memory, following the
// same rules as the API (amplify/api/routes/equipment.ts).

const today = () => new Date().toISOString().slice(0, 10)
const now = () => new Date().toISOString()
const pause = () => new Promise(resolve => setTimeout(resolve, 150))

type Machine = Omit<EquipmentDetailDto, 'tasks' | 'log'>
const machines = new Map<string, Machine>()
const tasks = new Map<string, Omit<MaintenanceTaskDto, 'due'>>()
const log: MaintenanceLogDto[] = []

const withDue = (task: Omit<MaintenanceTaskDto, 'due'>): MaintenanceTaskDto => ({ ...task, due: dueState(task, today()) })
const detail = (id: string): EquipmentDetailDto => {
    const machine = machines.get(id)
    if (!machine) throw new Error('Equipment not found')
    return {
        ...machine,
        tasks: [...tasks.values()].filter(t => t.equipmentID === id).map(withDue)
            .sort((a, b) => (a.templateCode ?? 'ZZ').localeCompare(b.templateCode ?? 'ZZ') || a.title.localeCompare(b.title)),
        log: log.filter(l => l.equipmentID === id).sort((a, b) => b.doneAt.localeCompare(a.doneAt))
    }
}

const addStandardTasks = (machine: Machine) => {
    const existing = new Set([...tasks.values()].filter(t => t.equipmentID === machine.id).map(t => t.templateCode))
    for (const template of templatesFor(machine.kind, machine.details).filter(t => !existing.has(t.code))) {
        const id = crypto.randomUUID()
        tasks.set(id, {
            id, equipmentID: machine.id, templateCode: template.code, title: template.title, guidance: template.guidance,
            checklist: template.checklist, videoUrl: null, intervalDays: template.intervalDays[machine.volume], intervalBalls: null,
            active: true, lastDoneAt: null, nextDueOn: addDays(today(), template.intervalDays[machine.volume])
        })
    }
}

const taskOf = (taskId: string) => {
    const task = tasks.get(taskId)
    if (!task) throw new Error('Task not found')
    return task
}

export const mockEquipmentApi: EquipmentApi = {
    async list(locationId) {
        await pause()
        return [...machines.values()].filter(m => m.locationID === locationId).map(m => detail(m.id))
    },
    async get(id) {
        await pause()
        return detail(id)
    },
    async create(locationId, input) {
        await pause()
        const parsed = equipmentCreateSchema.parse(input)
        const machine: Machine = {
            id: crypto.randomUUID(), locationID: locationId, kind: parsed.kind, name: parsed.name, manufacturer: parsed.manufacturer,
            model: parsed.model, serialNumber: parsed.serialNumber, purchasedOn: parsed.purchasedOn, status: parsed.status,
            volume: parsed.volume, details: parsed.details, notes: parsed.notes, createdAt: now(), updatedAt: now()
        }
        machines.set(machine.id, machine)
        addStandardTasks(machine)
        return detail(machine.id)
    },
    async update(id, input) {
        await pause()
        const parsed = equipmentUpdateSchema.parse(input)
        const before = machines.get(id)!
        const machine: Machine = {
            ...before,
            ...Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== undefined)),
            details: { ...before.details, ...(parsed.details ?? {}) },
            updatedAt: now()
        }
        machines.set(id, machine)
        if (parsed.volume && parsed.volume !== before.volume) {
            for (const task of [...tasks.values()].filter(t => t.equipmentID === id)) {
                const template = DRILL_PRESS_TEMPLATES.find(t => t.code === task.templateCode)
                if (!template) continue
                const days = template.intervalDays[parsed.volume]
                tasks.set(task.id, { ...task, intervalDays: days, nextDueOn: addDays(task.lastDoneAt?.slice(0, 10) ?? today(), days) })
            }
        }
        addStandardTasks(machine)
        return detail(id)
    },
    async addTask(id, input) {
        await pause()
        const parsed = maintenanceTaskCreateSchema.parse(input)
        const taskId = crypto.randomUUID()
        tasks.set(taskId, {
            id: taskId, equipmentID: id, templateCode: null, title: parsed.title, guidance: parsed.guidance, checklist: parsed.checklist,
            videoUrl: parsed.videoUrl, intervalDays: parsed.intervalDays, intervalBalls: parsed.intervalBalls, active: parsed.active,
            lastDoneAt: null, nextDueOn: parsed.intervalDays ? addDays(today(), parsed.intervalDays) : null
        })
        return detail(id)
    },
    async updateTask(taskId, input) {
        await pause()
        const parsed = maintenanceTaskUpdateSchema.parse(input)
        const task = taskOf(taskId)
        const intervalDays = parsed.intervalDays !== undefined ? parsed.intervalDays : task.intervalDays
        const from = task.lastDoneAt?.slice(0, 10) ?? today()
        const nextDueOn = parsed.nextDueOn ?? (parsed.intervalDays !== undefined && intervalDays ? addDays(from, intervalDays) : task.nextDueOn)
        tasks.set(taskId, {
            ...task, ...Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== undefined)), nextDueOn
        })
        return detail(task.equipmentID)
    },
    async completeTask(taskId, input) {
        await pause()
        const parsed = maintenanceCompleteSchema.parse(input)
        const task = taskOf(taskId)
        log.push({
            id: crypto.randomUUID(), equipmentID: task.equipmentID, taskID: taskId, kind: 'DONE', issueType: null, title: task.title,
            notes: parsed.notes, checklist: parsed.checked, doneByName: 'You', doneAt: now()
        })
        tasks.set(taskId, { ...task, lastDoneAt: now(), nextDueOn: task.intervalDays ? addDays(today(), task.intervalDays) : null })
        return detail(task.equipmentID)
    },
    async deleteTask(taskId) {
        await pause()
        const task = taskOf(taskId)
        if (task.templateCode) throw new Error('Standard tasks can be turned off, not removed')
        tasks.delete(taskId)
        return detail(task.equipmentID)
    },
    async reportIssue(id, input) {
        await pause()
        const parsed = equipmentIssueSchema.parse(input)
        log.push({
            id: crypto.randomUUID(), equipmentID: id, taskID: null, kind: 'ISSUE', issueType: parsed.issueType,
            title: { JAM: 'Machine jammed', BIT_SNAPPED: 'Bit snapped', OTHER: 'Problem reported' }[parsed.issueType],
            notes: parsed.notes, checklist: [], doneByName: 'You', doneAt: now()
        })
        if (parsed.issueType !== 'OTHER') {
            for (const task of [...tasks.values()].filter(t => t.equipmentID === id && t.templateCode === ALIGNMENT_TASK_CODE && t.active)) {
                tasks.set(task.id, { ...task, nextDueOn: today() })
            }
        }
        return detail(id)
    }
}

// A drill press at the first mock location, with a couple of tasks due.
void mockEquipmentApi.create('1', { kind: 'DRILL_PRESS', name: 'Main drill press', manufacturer: 'Jet', model: 'JMD-18', volume: 'STANDARD', details: { column: 'ROUND', jig: 'VACUUM' } })
    .then(press => {
        const wipe = press.tasks.find(t => t.templateCode === 'MD-02')
        const lube = press.tasks.find(t => t.templateCode === 'MD-03')
        if (wipe) tasks.set(wipe.id, { ...tasks.get(wipe.id)!, nextDueOn: today() })
        if (lube) tasks.set(lube.id, { ...tasks.get(lube.id)!, nextDueOn: addDays(today(), -2) })
    })
void mockEquipmentApi.create('1', { kind: 'BALL_SPINNER', name: 'Ball spinner', manufacturer: 'Jayhawk', model: 'BS-Pro' })
