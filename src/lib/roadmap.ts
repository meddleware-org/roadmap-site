// What the site knows about the hub's public routes. Both are same-origin (`connect-src 'self'`); neither carries
// anything internal. The parsers keep ONLY the fields the site shows, so a response that gained a field (or was
// tampered with in transit) cannot put anything extra on the page, and a malformed item is dropped instead of breaking
// the page.

// The badge tones the shared UI offers.
import type { BadgeTone } from '@meddleware/ui'
// Validators for untrusted JSON: an object check, and a string bounded in length.
import { isObj, str } from '@meddleware/web-utils'

/** The hub's public roadmap route (same origin). */
export const ROADMAP_PATH = '/public/v1/roadmap'
/** The hub's public snapshot route (same origin). */
export const SNAPSHOT_PATH = '/public/v1/snapshot'

/** The four states an item may be in. */
export type Status = 'planned' | 'in_progress' | 'done' | 'cancelled'
/** The statuses the page accepts; any other value drops the item. */
const STATUSES: readonly Status[] = ['planned', 'in_progress', 'done', 'cancelled']

/** One roadmap item as the page shows it: public wording, status and dates. */
export interface Item {
  id: string
  title: string
  description: string
  status: Status
  dueAt: string | null
  updatedAt: string | null
}

/** A phase: its public name and description, its window and its items. */
export interface Phase {
  id: string
  name: string
  description: string
  windowStart: string | null
  windowEnd: string | null
  items: Item[]
}

/** The roadmap document: when it was updated and its phases. */
export interface Roadmap {
  updatedAt: string | null
  phases: Phase[]
}

/** The latest signed copy of the roadmap, as the page describes it: who signed it, its fingerprint and where it is stored. */
export interface Snapshot {
  network: string
  generatedAt: string
  sha256: string
  signature: string
  signerAddress: string
  blobId: string | null
  expiresAt: string | null
  blobUrl: string | null
}

/** An ISO 8601 timestamp the browser can read, else null. */
const when = (v: unknown): string | null => (typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)) ? v : null)

/** Read one item, keeping only the fields the page shows; null for a malformed item. */
function parseItem(v: unknown): Item | null {
  if (!isObj(v)) return null
  // The identifier, bounded.
  const id = str(v.id, 64)
  // The title, bounded.
  const title = str(v.title, 300)
  // The status, only if it is one of the four.
  const status = STATUSES.find((s) => s === v.status)
  // An item without all three is dropped.
  if (!id || !title || !status) return null
  // Only the displayed fields, with the dates read defensively.
  return { id, title, description: str(v.description, 4000) ?? '', status, dueAt: when(v.due_at), updatedAt: when(v.updated_at) }
}

/** Read one phase and its items (at most 500), keeping only the fields the page shows; null for a malformed phase. */
function parsePhase(v: unknown): Phase | null {
  if (!isObj(v)) return null
  const id = str(v.id, 64)
  // The phase's name, bounded.
  const name = str(v.name, 300)
  if (!id || !name) return null
  // At most 500 items; a malformed one is dropped, not fatal.
  const items = Array.isArray(v.items) ? v.items.slice(0, 500).map(parseItem).filter((x): x is Item => x !== null) : []
  // Only the displayed fields.
  return { id, name, description: str(v.description, 4000) ?? '', windowStart: when(v.window_start), windowEnd: when(v.window_end), items }
}

/** The roadmap document, or null when it is not one. */
export function parseRoadmap(v: unknown): Roadmap | null {
  // Only schema 1 with a list of phases is a roadmap.
  if (!isObj(v) || v.schema_version !== 1 || !Array.isArray(v.phases)) return null
  // At most 100 phases, each parsed defensively.
  return { updatedAt: when(v.updated_at), phases: v.phases.slice(0, 100).map(parsePhase).filter((x): x is Phase => x !== null) }
}

/** The latest snapshot of the `/public/v1/snapshot` response, or null (none yet, or not a snapshot response). */
export function parseRoadmapSnapshot(v: unknown): Snapshot | null {
  if (!isObj(v) || !isObj(v.snapshot)) return null
  // The snapshot object.
  const s = v.snapshot
  // The fingerprint, which must be 64 lower-case hex digits.
  const sha256 = str(s.sha256, 64)
  // The signature text, bounded.
  const signature = str(s.signature, 400)
  // The signer, which must be a 32-byte address.
  const signerAddress = str(s.signer_address, 66)
  // The network's name.
  const network = str(s.network, 12)
  // When the copy was made.
  const generatedAt = when(s.generated_at)
  // Any missing or malformed part means there is no usable snapshot.
  if (!sha256 || !/^[0-9a-f]{64}$/.test(sha256) || !signature || !signerAddress || !/^0x[0-9a-f]{64}$/.test(signerAddress) || !network || !generatedAt) {
    return null
  }
  // The document's address, only if it is a plain https address of sensible length.
  const blobUrl = typeof v.blob_url === 'string' && /^https:\/\/[^\s]+$/.test(v.blob_url) && v.blob_url.length <= 500 ? v.blob_url : null
  // Only the displayed fields.
  return { network, generatedAt, sha256, signature, signerAddress, blobId: str(s.blob_id, 100), expiresAt: when(s.expires_at), blobUrl }
}

/** The words for each status: the label carries the meaning. */
export const STATUS_LABEL: Record<Status, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

/** How a status is toned and marked in a badge (the label carries the meaning; the tone and symbol reinforce it). */
export const STATUS_TONE: Record<Status, BadgeTone> = { planned: 'neutral', in_progress: 'warn', done: 'ok', cancelled: 'danger' }
/** A symbol for each status, to reinforce the label (never the only cue). */
export const STATUS_SYMBOL: Record<Status, string> = { planned: '○', in_progress: '◐', done: '✓', cancelled: '✗' }

/** Items of a phase that match a status filter (`all` keeps everything). */
export function filterItems(phase: Phase, filter: Status | 'all'): Item[] {
  // `all` keeps everything; otherwise only the items with that status.
  return filter === 'all' ? phase.items : phase.items.filter((i) => i.status === filter)
}
