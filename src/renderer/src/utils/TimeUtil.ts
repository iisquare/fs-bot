export function groupByTime<T extends { updatedAt: string }>(
  items: T[]
): {
  today: T[]
  yesterday: T[]
  thisWeek: T[]
  earlier: T[]
} {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)

  const groups = {
    today: [] as T[],
    yesterday: [] as T[],
    thisWeek: [] as T[],
    earlier: [] as T[]
  }

  for (const item of items) {
    const d = new Date(item.updatedAt)
    const ds = d.toDateString()
    if (ds === todayStr) {
      groups.today.push(item)
    } else if (ds === yesterdayStr) {
      groups.yesterday.push(item)
    } else if (d >= weekAgo) {
      groups.thisWeek.push(item)
    } else {
      groups.earlier.push(item)
    }
  }

  return groups
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export const GROUP_LABELS: Record<string, string> = {
  today: '今天',
  yesterday: '昨天',
  thisWeek: '本周',
  earlier: '更早'
}
