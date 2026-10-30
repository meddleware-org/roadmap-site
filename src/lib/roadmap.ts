// What the site knows about the hub's public routes. Both are same-origin (`connect-src 'self'`); neither carries
// anything internal. The parsers keep ONLY the fields the site shows, so a response that gained a field (or was
// tampered with in transit) cannot put anything extra on the page, and a malformed item is dropped instead of breaking
// the page.

export const ROADMAP_PATH = '/public/v1/roadmap'
export const SNAPSHOT_PATH = '/public/v1/snapshot'

export type Status = 'planned' | 'in_progress' | 'done' | 'cancelled'
const STATUSES: readonly Status[] = ['planned', 'in_progress', 'done', 'cancelled']

export interface Item {
  id: string
  title: string
  description: string
  status: Status
  dueAt: string | null
  updatedAt: string | null
}

export interface Phase {
  id: string
  name: string
  description: string
  windowStart: string | null
  windowEnd: string | null
  items: Item[]
}

export interface Roadmap {
  updatedAt: string | null
  phases: Phase[]
}

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

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const text = (v: unknown, max: number): string | null => (typeof v === 'string' && v.length <= max ? v : null)
/** An ISO 8601 timestamp the browser can read, else null. */
const when = (v: unknown): string | null => (typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v)) ? v : null)

function parseItem(v: unknown): Item | null {
  if (!isObj(v)) return null
  const id = text(v.id, 64)
  const title = text(v.title, 300)
  const status = STATUSES.find((s) => s === v.status)
  if (!id || !title || !status) return null
  return { id, title, description: text(v.description, 4000) ?? '', status, dueAt: when(v.due_at), updatedAt: when(v.updated_at) }
}

function parsePhase(v: unknown): Phase | null {
  if (!isObj(v)) return null
  const id = text(v.id, 64)
  const name = text(v.name, 300)
  if (!id || !name) return null
  const items = Array.isArray(v.items) ? v.items.slice(0, 500).map(parseItem).filter((x): x is Item => x !== null) : []
  return { id, name, description: text(v.description, 4000) ?? '', windowStart: when(v.window_start), windowEnd: when(v.window_end), items }
}

/** The roadmap document, or null when it is not one. */
export function parseRoadmap(v: unknown): Roadmap | null {
  if (!isObj(v) || v.schema_version !== 1 || !Array.isArray(v.phases)) return null
  return { updatedAt: when(v.updated_at), phases: v.phases.slice(0, 100).map(parsePhase).filter((x): x is Phase => x !== null) }
}

/** The latest snapshot of the `/public/v1/snapshot` response, or null (none yet, or not a snapshot response). */
export function parseSnapshot(v: unknown): Snapshot | null {
  if (!isObj(v) || !isObj(v.snapshot)) return null
  const s = v.snapshot
  const sha256 = text(s.sha256, 64)
  const signature = text(s.signature, 400)
  const signerAddress = text(s.signer_address, 66)
  const network = text(s.network, 12)
  const generatedAt = when(s.generated_at)
  if (!sha256 || !/^[0-9a-f]{64}$/.test(sha256) || !signature || !signerAddress || !/^0x[0-9a-f]{64}$/.test(signerAddress) || !network || !generatedAt) {
    return null
  }
  const blobUrl = typeof v.blob_url === 'string' && /^https:\/\/[^\s]+$/.test(v.blob_url) && v.blob_url.length <= 500 ? v.blob_url : null
  return { network, generatedAt, sha256, signature, signerAddress, blobId: text(s.blob_id, 100), expiresAt: when(s.expires_at), blobUrl }
}

export const STATUS_LABEL: Record<Status, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

/** Items of a phase that match a status filter (`all` keeps everything). */
export function filterItems(phase: Phase, filter: Status | 'all'): Item[] {
  return filter === 'all' ? phase.items : phase.items.filter((i) => i.status === filter)
}
