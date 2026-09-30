import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const app = express()
app.use(cors())
app.use(express.json())
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

const schemas = {
  goal: z.object({ title: z.string().min(1), description: z.string().optional().default(''), category: z.string().default('Personal'), progress: z.coerce.number().min(0).max(100).default(0), deadline: z.string().optional().nullable(), status: z.string().default('Not Started') }),
  wishlist: z.object({ name: z.string().min(1), description: z.string().optional().default(''), targetPrice: z.coerce.number().positive(), savedAmount: z.coerce.number().min(0).default(0), category: z.string().default('Other'), priority: z.string().default('Medium'), targetDate: z.string().optional().nullable(), status: z.string().default('Planning') }),
  transaction: z.object({ amount: z.coerce.number().positive(), type: z.string(), category: z.string(), note: z.string().optional().default(''), date: z.string(), wishlistItemId: z.string().optional().nullable() }),
  diary: z.object({ date: z.string(), title: z.string().min(1), mood: z.string(), content: z.string().min(1), tags: z.string().optional().default('') }),
  habit: z.object({ name: z.string().min(1), frequency: z.string().default('Daily') }),
  event: z.object({ title: z.string().min(1), date: z.string(), time: z.string().optional().default(''), notes: z.string().optional().default('') }),
  note: z.object({ title: z.string().min(1), content: z.string(), tags: z.string().optional().default(''), pinned: z.boolean().default(false) })
}
const dateFields = new Set(['deadline', 'targetDate', 'date'])
function cleanData(data: Record<string, unknown>) {
  const result = { ...data }
  for (const field of dateFields) if (typeof result[field] === 'string' && result[field]) result[field] = new Date(result[field] as string)
  return result
}
function crud<T extends keyof typeof schemas>(path: string, model: any, schema: (typeof schemas)[T], orderBy: any = { createdAt: 'desc' }, findOptions: any = {}) {
  app.get(`/api/${path}`, async (_req, res) => { try { res.json(await model.findMany({ orderBy, ...findOptions })) } catch { res.status(500).json({ error: 'Unable to load data' }) } })
  app.post(`/api/${path}`, async (req, res) => { try { const data = schema.parse(req.body); res.status(201).json(await model.create({ data: cleanData(data) })) } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid data' }) } })
  app.patch(`/api/${path}/:id`, async (req, res) => { try { const data = schema.partial().parse(req.body); res.json(await model.update({ where: { id: req.params.id }, data: cleanData(data) })) } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update' }) } })
  app.delete(`/api/${path}/:id`, async (req, res) => { try { await model.delete({ where: { id: req.params.id } }); res.status(204).end() } catch { res.status(404).json({ error: 'Not found' }) } })
}
crud('goals', prisma.goal, schemas.goal)
crud('wishlist', prisma.wishlistItem, schemas.wishlist)
crud('transactions', prisma.transaction, schemas.transaction, { date: 'desc' })
crud('diary', prisma.diaryEntry, schemas.diary, { date: 'desc' })
crud('habits', prisma.habit, schemas.habit, { createdAt: 'desc' }, { include: { completions: true } })
crud('events', prisma.calendarEvent, schemas.event, { date: 'asc' })
crud('notes', prisma.note, schemas.note, [{ pinned: 'desc' }, { updatedAt: 'desc' }])
app.get('/api/diary/:id', async (req, res) => { try { res.json(await prisma.diaryEntry.findUniqueOrThrow({ where: { id: req.params.id } })) } catch { res.status(404).json({ error: 'Not found' }) } })
app.post('/api/habits/:id/complete', async (req, res) => { try { const date = new Date(req.body.date || new Date().toISOString()); const start = new Date(date); start.setHours(0, 0, 0, 0); const existing = await prisma.habitCompletion.findFirst({ where: { habitId: req.params.id, date: start } }); if (existing) { await prisma.habitCompletion.delete({ where: { id: existing.id } }); return res.json({ completed: false }) } await prisma.habitCompletion.create({ data: { habitId: req.params.id, date: start } }); res.json({ completed: true }) } catch { res.status(400).json({ error: 'Unable to update habit' }) } })
app.get('/api/dashboard', async (_req, res) => { try { const [transactions, goals, wishlist, diary, events, habits] = await Promise.all([prisma.transaction.findMany({ orderBy: { date: 'desc' } }), prisma.goal.findMany(), prisma.wishlistItem.findMany(), prisma.diaryEntry.findMany({ orderBy: { date: 'desc' }, take: 3 }), prisma.calendarEvent.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: 'asc' }, take: 4 }), prisma.habit.findMany({ include: { completions: true } })]); const totalIncome = transactions.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0); const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0); const totalSaved = transactions.filter(t => t.type === 'Saving').reduce((s, t) => s + t.amount, 0); const target = wishlist.reduce((s, w) => s + w.targetPrice, 0); const saved = wishlist.reduce((s, w) => s + w.savedAmount, 0); res.json({ availableMoney: totalIncome - totalExpenses - totalSaved, totalSaved, totalIncome, totalExpenses, activeGoals: goals.filter(g => g.status !== 'Completed').length, wishlistProgress: target ? Math.round(saved / target * 100) : 0, recentTransactions: transactions.slice(0, 5), recentDiaryEntries: diary, upcomingEvents: events, habitProgress: habits.reduce((sum, h) => sum + h.completions.length, 0) }) } catch { res.status(500).json({ error: 'Unable to load dashboard' }) } })
app.get('/api/export', async (_req, res) => { const data = { goals: await prisma.goal.findMany(), wishlist: await prisma.wishlistItem.findMany(), transactions: await prisma.transaction.findMany(), diary: await prisma.diaryEntry.findMany(), habits: await prisma.habit.findMany(), events: await prisma.calendarEvent.findMany(), notes: await prisma.note.findMany() }; res.json(data) })
const port = Number(process.env.PORT || 4000)
app.listen(port, () => console.log(`LifeTrack API running at http://localhost:${port}`))
