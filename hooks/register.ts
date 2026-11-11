import type {
  EngineInterface,
  Register,
  SessionContextUsage,
  SessionCost,
  SessionRateLimit,
} from 'claude-code'

type Figures = {
  context: SessionContextUsage
  rateLimits: SessionRateLimit[]
  cost?: SessionCost
}

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'spend',
}

const label = (kind: string) => LABELS[kind] ?? kind

function bar(percent: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(percent / 20)))
  return '▰'.repeat(filled) + '▱'.repeat(5 - filled)
}

function untilReset(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const ms = Date.parse(resetsAt) - now
  if (!(ms > 0)) return ''
  const mins = Math.round(ms / 60000)
  if (mins < 60) return ` ↻${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return ` ↻${hours}h${String(mins % 60).padStart(2, '0')}`
  return ` ↻${Math.floor(hours / 24)}d${hours % 24}h`
}

function line(f: Figures, now: number): string {
  const parts: string[] = []

  for (const r of f.rateLimits) {
    const warn = r.percentUsed >= 90 ? '⚠ ' : ''
    parts.push(
      `${warn}${label(r.kind)} ${bar(r.percentUsed)} ${r.percentUsed}%${untilReset(r.resetsAt, now)}`,
    )
  }

  if (f.context.percent !== undefined) {
    parts.push(`ctx ${Math.round(f.context.percent)}%`)
  }

  if (f.cost !== undefined) {
    parts.push(`$${f.cost.usd.toFixed(2)}`)
  }

  return parts.length > 0
    ? `Usage · ${parts.join(' · ')}`
    : 'Usage · waiting for first reply…'
}

let last: Figures | undefined
const warned = new Set<string>()

async function show($: EngineInterface, f: Figures): Promise<void> {
  last = { context: f.context, rateLimits: f.rateLimits, cost: f.cost }
  $.ui.status(line(last, await $.clock.now()))

  for (const r of f.rateLimits) {
    if (r.percentUsed >= 90 && !warned.has(r.kind)) {
      warned.add(r.kind)
      $.ui.toast(`${label(r.kind)} usage at ${r.percentUsed}%`)
    } else if (r.percentUsed < 80) {
      warned.delete(r.kind)
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await show($, await $.session.usage())
    return result
  })

  on('session.measure', async ($, e, next) => {
    await show($, e)
    return next(e)
  })

  // Refresh the reset countdown after every turn.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (last) $.ui.status(line(last, await $.clock.now()))
    return result
  })
}
