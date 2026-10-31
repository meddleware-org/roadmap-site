import { describe, expect, it } from 'vitest'
import { STATUS_LABEL, STATUS_SYMBOL, STATUS_TONE, filterItems, parseRoadmap, parseRoadmapSnapshot } from '../src/lib/roadmap.js'
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
    const s = parseRoadmapSnapshot(snapshotResponse)!
    expect(s).toMatchObject({ network: 'testnet', sha256: SHA, signerAddress: SIGNER, blobId: 'Qc9aP0V6x3mYk2w1TnqL8sRZb4dEoFhJiUyXvCgA7MM' })
    expect(s.blobUrl).toBe('https://aggregator.example.org/v1/blobs/Qc9aP0V6x3mYk2w1TnqL8sRZb4dEoFhJiUyXvCgA7MM')
    expect(JSON.stringify(s)).not.toContain('object_id')
  })

  it('is null when there is none, or the response is wrong, or a link is not https', () => {
    expect(parseRoadmapSnapshot(noSnapshot)).toBeNull()
    expect(parseRoadmapSnapshot(null)).toBeNull()
    expect(parseRoadmapSnapshot({ snapshot: { ...snapshotResponse.snapshot, sha256: 'xyz' } })).toBeNull()
    expect(parseRoadmapSnapshot({ snapshot: { ...snapshotResponse.snapshot, signer_address: '0x12' } })).toBeNull()
    expect(parseRoadmapSnapshot({ ...snapshotResponse, blob_url: 'javascript:alert(1)' })!.blobUrl).toBeNull()
    expect(parseRoadmapSnapshot({ ...snapshotResponse, blob_url: 'http://plain.example.org/x' })!.blobUrl).toBeNull()
  })
})

describe('status badges', () => {
  it('give every status a label, a tone and a symbol; the label carries the meaning', () => {
    for (const status of ['planned', 'in_progress', 'done', 'cancelled'] as const) {
      expect(STATUS_LABEL[status]).toBeTruthy()
      expect(STATUS_TONE[status]).toBeTruthy()
      expect(STATUS_SYMBOL[status]).toBeTruthy()
    }
    expect(STATUS_TONE).toEqual({ planned: 'neutral', in_progress: 'warn', done: 'ok', cancelled: 'danger' })
  })
})
