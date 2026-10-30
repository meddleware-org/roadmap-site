// Dates for people. The hub sends UTC instants; the page shows them in the visitor's own zone, naming it.

const day = { day: 'numeric', month: 'short', year: 'numeric' } as const
const dateTime = new Intl.DateTimeFormat('en-GB', { ...day, hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' })
const dateOnly = new Intl.DateTimeFormat('en-GB', day)

export function formatDateTime(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? '' : dateTime.format(new Date(ms))
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? '' : dateOnly.format(new Date(ms))
}

/** `1 Mar 2027 – 31 May 2027`, or one side, or nothing. */
export function formatWindow(start: string | null, end: string | null): string {
  const a = formatDate(start)
  const b = formatDate(end)
  if (a && b) return `${a} – ${b}`
  return a ? `From ${a}` : b ? `Until ${b}` : ''
}
