export type Goal = { id: string; title: string; description: string; category: string; progress: number; deadline?: string | null; status: string }
export type WishlistItem = { id: string; name: string; description: string; targetPrice: number; savedAmount: number; category: string; priority: string; targetDate?: string | null; status: string }
export type Transaction = { id: string; amount: number; type: string; category: string; note: string; date: string; wishlistItemId?: string | null }
export type DiaryEntry = { id: string; date: string; title: string; mood: string; content: string; tags: string }
export type Habit = { id: string; name: string; frequency: string; completions: { date: string }[] }
export type CalendarEvent = { id: string; title: string; date: string; time: string; notes: string }
export type Note = { id: string; title: string; content: string; tags: string; pinned: boolean }
export type Dashboard = { availableMoney: number; totalSaved: number; totalIncome: number; totalExpenses: number; activeGoals: number; wishlistProgress: number; recentTransactions: Transaction[]; recentDiaryEntries: DiaryEntry[]; upcomingEvents: CalendarEvent[]; habitProgress: number }
