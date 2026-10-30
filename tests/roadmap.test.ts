import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatWindow } from '../src/lib/format.js'
import { filterItems, parseRoadmap, parseSnapshot } from '../src/lib/roadmap.js'
import { SHA, SIGNER, empty, noSnapshot, roadmap, snapshotResponse } from './support/fixtures.js'

describe('the roadmap parser keeps only what the page shows', () => {
  const r = parseRoadmap(roadmap)!

  it('reads phases and items', () => {
    expect(r.updatedAt).toBe('2026-10-29T12:00:00Z')
    expect(r.phases.map((p) => p.name)).toEqual(['Foundations', 'Growth'])
    expect(r.phases[0]!.items.map((i) => [i.title, i.status])).toEqual([
      ['Open the testnet', 'done'],
      ['Mint opens', 'planned'],
      ['Docs site', 'in_progress'],
    ])
    expect(r.phases[0]!.windowEnd).toBe('2027-01-31T00:00:00Z')
  })

  it('drops every field it does not display, so nothing internal can reach the page', () => {
    const text = JSON.stringify(r)
    for (const leaked of ['SECRET', 'phase-1', 'internal_', 'visible_bot', 'task_ids', 'key']) expect(text, leaked).not.toContain(leaked)
    expect(Object.keys(r.phases[0]!).sort()).toEqual(['description', 'id', 'items', 'name', 'windowEnd', 'windowStart'])
    expect(Object.keys(r.phases[0]!.items[0]!).sort()).toEqual(['description', 'dueAt', 'id', 'status', 'title', 'updatedAt'])
  })

  it('drops a malformed item or phase instead of breaking the page', () => {
    const bad = {
      schema_version: 1,
      updated_at: 'not a date',
      phases: [
        null,
        'x',
        { id: 'p', name: '' },
        { id: 'ok', name: 'Fine', items: [{ id: 'a', title: 'No status' }, { id: 'b', title: 'Odd status', status: 'secret' }, { id: 'c', title: 'Good', status: 'planned', due_at: 'garbage' }, 5] },
      ],
    }
    const p = parseRoadmap(bad)!
    expect(p.updatedAt).toBeNull()
    expect(p.phases).toHaveLength(1)
    expect(p.phases[0]!.items).toEqual([{ id: 'c', title: 'Good', description: '', status: 'planned', dueAt: null, updatedAt: null }])
  })

  it('refuses what is not a roadmap, and bounds what it accepts', () => {
    for (const v of [null, [], 'x', {}, { schema_version: 2, phases: [] }, { schema_version: 1 }, { schema_version: 1, phases: 'x' }]) expect(parseRoadmap(v)).toBeNull()
    expect(parseRoadmap(empty)).toEqual({ updatedAt: null, phases: [] })
    const many = { schema_version: 1, phases: Array.from({ length: 300 }, (_, i) => ({ id: `p${i}`, name: 'P', items: [] })) }
    expect(parseRoadmap(many)!.phases).toHaveLength(100)
    const long = { schema_version: 1, phases: [{ id: 'p', name: 'x'.repeat(301), items: [] }] }
    expect(parseRoadmap(long)!.phases).toHaveLength(0)
  })

  it('filters items by status', () => {
    const p = r.phases[0]!
    expect(filterItems(p, 'all')).toHaveLength(3)
    expect(filterItems(p, 'done').map((i) => i.title)).toEqual(['Open the testnet'])
    expect(filterItems(p, 'cancelled')).toEqual([])
  })
})

describe('the snapshot parser', () => {
  it('reads the latest snapshot and the blob link', () => {
    const s = parseSnapshot(snapshotResponse)!
    expect(s).toMatchObject({ network: 'testnet', sha256: SHA, signerAddress: SIGNER, blobId: 'Qc9aP0V6x3mYk2w1TnqL8sRZb4dEoFhJiUyXvCgA7MM' })
    expect(s.blobUrl).toBe('https://aggregator.example.org/v1/blobs/Qc9aP0V6x3mYk2w1TnqL8sRZb4dEoFhJiUyXvCgA7MM')
    expect(JSON.stringify(s)).not.toContain('object_id')
  })

  it('is null when there is none, or the response is wrong, or a link is not https', () => {
    expect(parseSnapshot(noSnapshot)).toBeNull()
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot({ snapshot: { ...snapshotResponse.snapshot, sha256: 'xyz' } })).toBeNull()
    expect(parseSnapshot({ snapshot: { ...snapshotResponse.snapshot, signer_address: '0x12' } })).toBeNull()
    expect(parseSnapshot({ ...snapshotResponse, blob_url: 'javascript:alert(1)' })!.blobUrl).toBeNull()
    expect(parseSnapshot({ ...snapshotResponse, blob_url: 'http://plain.example.org/x' })!.blobUrl).toBeNull()
  })
})

describe('dates for people', () => {
  it('shows instants in the visitor zone, naming it, and nothing for garbage', () => {
    expect(formatDateTime('2026-07-01T08:30:00Z')).toMatch(/1 Jul 2026/)
    expect(formatDateTime('2026-07-01T08:30:00Z')).toMatch(/[A-Z]{2,5}|GMT/)
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime('nope')).toBe('')
    expect(formatDate('2027-03-01T12:00:00Z')).toBe('1 Mar 2027')
  })

  it('writes a window as a range or one open end', () => {
    expect(formatWindow('2026-10-01T12:00:00Z', '2027-01-31T12:00:00Z')).toBe('1 Oct 2026 – 31 Jan 2027')
    expect(formatWindow('2026-10-01T12:00:00Z', null)).toBe('From 1 Oct 2026')
    expect(formatWindow(null, '2027-01-31T12:00:00Z')).toBe('Until 31 Jan 2027')
    expect(formatWindow(null, null)).toBe('')
  })
})
