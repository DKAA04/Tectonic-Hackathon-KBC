import type { Context } from './types.ts'

export function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}
export function readableMessage(value: string) {
  return value.replace(/\b\d{4}-\d{2}-\d{2}\b/g, date => Number.isFinite(Date.parse(date)) ? displayDate(date) : date)
}
export const displayTime = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
export const situationLabel = (c: Context) => ({ unknown: 'No inferred move', tentative: 'A possible move', confirmed: 'Move confirmed', cancelled: 'Move cancelled' })[c.situation.status]
export const changeLabel = (action: string) => ({ confirm: 'Move confirmed', change_date: 'Move date changed', cancel: 'Move cancelled', set_reminder: 'Help timing changed', update: 'Consent preferences updated' })[action] || 'Context updated'

// Any accepted context change invalidates local preparation drafts. Time-driven
// suppression also invalidates drafts even without a version increment.
export const draftKey = (c: Context) => [c.session.id, c.version, c.decision.reason_code, c.situation.move_date, c.situation.remind_on, JSON.stringify(c.consent), c.decision.next_steps.map(s => s.id).join(',')].join(':')
